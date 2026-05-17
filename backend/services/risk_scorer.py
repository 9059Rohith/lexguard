from typing import List, Dict


# Category weights for aggregate CRI calculation (must sum to 1.0 per contract profile)
CATEGORY_WEIGHTS: Dict[str, float] = {
    "Employment": 0.25,
    "Financial": 0.25,
    "IP": 0.20,
    "Privacy": 0.15,
    "Compliance": 0.10,
    "Operational": 0.05,
}

# Per-contract-type weight overrides (normalization enforced at runtime)
CONTRACT_TYPE_WEIGHT_OVERRIDES: Dict[str, Dict[str, float]] = {
    "freelance":    {"IP": 0.35, "Financial": 0.25, "Employment": 0.15, "Privacy": 0.10, "Compliance": 0.10, "Operational": 0.05},
    "employment":   {"Employment": 0.35, "Financial": 0.20, "IP": 0.15, "Privacy": 0.15, "Compliance": 0.10, "Operational": 0.05},
    "vendor":       {"Financial": 0.30, "Compliance": 0.20, "IP": 0.15, "Privacy": 0.15, "Employment": 0.10, "Operational": 0.10},
    "rental":       {"Financial": 0.30, "Compliance": 0.25, "Operational": 0.20, "Privacy": 0.10, "Employment": 0.10, "IP": 0.05},
    "nda":          {"Privacy": 0.40, "IP": 0.30, "Compliance": 0.15, "Employment": 0.05, "Financial": 0.05, "Operational": 0.05},
    "saas":         {"Privacy": 0.30, "Financial": 0.25, "IP": 0.20, "Compliance": 0.15, "Operational": 0.05, "Employment": 0.05},
}

# Likelihood scale definitions (L_i ∈ 1-5)
LIKELIHOOD_LABELS = {1: "Rare (<10%)", 2: "Unlikely (10-30%)", 3: "Possible (30-50%)", 4: "Likely (50-90%)", 5: "Almost Certain (>90%)"}
# Severity scale definitions (I_i ∈ 1-5)
SEVERITY_LABELS = {1: "Insignificant", 2: "Minor", 3: "Moderate", 4: "Major", 5: "Catastrophic"}


def _normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """Enforce Σ w_i = 1 normalization constraint."""
    total = sum(weights.values())
    if total == 0:
        return CATEGORY_WEIGHTS
    return {k: v / total for k, v in weights.items()}


def score_clause(likelihood: int, severity: int) -> float:
    """
    Individual clause risk score: S_i = L_i × I_i  (range 1–25)
    L_i ∈ {1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain}
    I_i ∈ {1=Insignificant, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic}
    """
    l = max(1, min(5, likelihood))
    s = max(1, min(5, severity))
    return float(l * s)


def adjusted_score(likelihood: int, severity: int, a_current: float = 3.0) -> float:
    """
    Environmental current impact adjusted score:
    S_adjusted = ((L_i + I_i + A_current) / 3) * 2 - 1
    A_current ∈ [1, 5] reflects real-time factors (jurisdiction risk, counterparty leverage).
    Returns value in [1, 9] range; values ≥ 5.0 trigger manual legal review routing.
    """
    l = max(1.0, min(5.0, float(likelihood)))
    s = max(1.0, min(5.0, float(severity)))
    a = max(1.0, min(5.0, float(a_current)))
    return round(((l + s + a) / 3.0) * 2.0 - 1.0, 3)


def classify_clause(score: float) -> str:
    """Classify individual clause risk level from raw S_i score."""
    if score <= 6:
        return "low"
    elif score <= 14:
        return "moderate"
    else:
        return "high"


def requires_legal_review(adj_score: float) -> bool:
    """Return True if adjusted score ≥ 5.0 → suspend automation, route to external review."""
    return adj_score >= 5.0


def compute_cri(clauses: list, contract_type: str = "") -> float:
    """
    Weighted Aggregate Contract Risk Index (CRI) normalized to 0–100:
    CRI = Σ(w_i · S_i) / Σ(w_i) / 25 × 100
    Weights are selected per contract profile and normalized to sum to 1.
    """
    if not clauses:
        return 0.0

    ct = (contract_type or "").lower()
    raw_weights = CONTRACT_TYPE_WEIGHT_OVERRIDES.get(ct, CATEGORY_WEIGHTS)
    weights = _normalize_weights(raw_weights)

    weighted_sum = 0.0
    weight_total = 0.0

    for clause in clauses:
        category = clause.get("category", "Operational")
        score = clause.get("risk_score", 9.0)
        weight = weights.get(category, 0.05)
        weighted_sum += weight * score
        weight_total += weight

    if weight_total == 0:
        return 0.0

    cri = (weighted_sum / weight_total) / 25.0 * 100.0
    return round(min(100.0, max(0.0, cri)), 2)


def classify_cri(cri: float) -> str:
    """
    Dynamic Risk Tier Router:
    Low    → CRI ≤ 0.30 × CRI_max (30)   → auto-approved
    Moderate → 30 < CRI ≤ 70              → flagged for review
    High   → CRI > 0.70 × CRI_max (70)   → suspended for manual audit
    """
    CRI_MAX = 100.0
    if cri <= 0.30 * CRI_MAX:
        return "low"
    elif cri <= 0.70 * CRI_MAX:
        return "moderate"
    else:
        return "high"


def score_clauses(raw_clauses: list, contract_type: str = "") -> list:
    """
    Score every extracted clause:
    1. Compute S_i = L_i × I_i
    2. Compute S_adjusted using A_current
    3. Flag for legal review if S_adjusted ≥ 5.0
    4. Classify risk level
    """
    scored = []
    # Environmental modifier: default 3 (neutral); could be injected from jurisdiction signals
    a_current = 3.0

    for i, clause in enumerate(raw_clauses):
        likelihood = int(clause.get("risk_likelihood", 3))
        severity = int(clause.get("risk_severity", 3))
        score = score_clause(likelihood, severity)
        adj = adjusted_score(likelihood, severity, a_current)
        level = classify_clause(score)
        needs_review = requires_legal_review(adj)

        scored.append({
            **clause,
            "risk_score": score,
            "risk_score_adjusted": adj,
            "requires_legal_review": needs_review,
            "risk_level": level,
            "order_index": i,
            "likelihood_label": LIKELIHOOD_LABELS.get(likelihood, ""),
            "severity_label": SEVERITY_LABELS.get(severity, ""),
        })
    # Sort by adjusted score descending for triage priority
    scored.sort(key=lambda x: x["risk_score_adjusted"], reverse=True)
    return scored
