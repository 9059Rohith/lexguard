"""
Pairwise Contradiction and Logic Auditor.

Scans all extracted clauses for internal logical inconsistencies:
- Conflicting notice periods
- Mismatched governing laws
- Contradictory liability caps
- Termination vs. survival clause conflicts
"""
from __future__ import annotations
import re
from typing import List, Dict, Any, Tuple


# ── Contradiction detection rules ────────────────────────────────────────────

def _extract_numbers(text: str) -> List[int]:
    return [int(n) for n in re.findall(r'\b(\d+)\s*days?\b', text, re.I)]


def _extract_states(text: str) -> List[str]:
    us_states = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
        "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
        "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
        "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
        "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
        "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
        "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
        "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
        "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
    ]
    found = []
    tl = text.lower()
    for state in us_states:
        if state.lower() in tl:
            found.append(state)
    return found


def _has_keyword(text: str, keywords: List[str]) -> bool:
    tl = text.lower()
    return any(k.lower() in tl for k in keywords)


class Contradiction:
    """A detected logical inconsistency between two clauses."""
    def __init__(self, clause_a_type: str, clause_b_type: str,
                 category: str, description: str, severity: str = "moderate"):
        self.clause_a_type = clause_a_type
        self.clause_b_type = clause_b_type
        self.category = category
        self.description = description
        self.severity = severity  # low | moderate | high

    def to_dict(self) -> Dict[str, Any]:
        return {
            "clause_a": self.clause_a_type,
            "clause_b": self.clause_b_type,
            "category": self.category,
            "description": self.description,
            "severity": self.severity,
        }


def detect_contradictions(clauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Pairwise cross-audit of all extracted clauses.
    Returns a list of detected contradiction dicts.
    """
    contradictions: List[Contradiction] = []

    for i in range(len(clauses)):
        for j in range(i + 1, len(clauses)):
            a, b = clauses[i], clauses[j]
            a_text = (a.get("raw_text", "") + " " + a.get("clause_type", "")).lower()
            b_text = (b.get("raw_text", "") + " " + b.get("clause_type", "")).lower()
            a_type = a.get("clause_type", "Clause A")
            b_type = b.get("clause_type", "Clause B")

            # 1. Conflicting notice periods
            a_days = _extract_numbers(a.get("raw_text", ""))
            b_days = _extract_numbers(b.get("raw_text", ""))
            if a_days and b_days and "notice" in a_text and "notice" in b_text:
                if max(a_days) != max(b_days) and abs(max(a_days) - max(b_days)) > 10:
                    contradictions.append(Contradiction(
                        a_type, b_type,
                        "Notice Period Conflict",
                        f"'{a_type}' specifies {max(a_days)}-day notice while '{b_type}' specifies {max(b_days)}-day notice. These may conflict under a termination scenario.",
                        "high",
                    ))

            # 2. Conflicting governing law / jurisdiction
            a_states = _extract_states(a.get("raw_text", ""))
            b_states = _extract_states(b.get("raw_text", ""))
            if a_states and b_states:
                a_law = "governing law" in a_text or "jurisdiction" in a_text
                b_law = "governing law" in b_text or "jurisdiction" in b_text
                if (a_law or b_law) and set(a_states) != set(b_states):
                    contradictions.append(Contradiction(
                        a_type, b_type,
                        "Jurisdiction Conflict",
                        f"'{a_type}' references {', '.join(a_states)} law while '{b_type}' references {', '.join(b_states)} law. Conflicting choice-of-law creates enforcement ambiguity.",
                        "high",
                    ))

            # 3. Unlimited liability vs. liability cap
            if _has_keyword(a.get("raw_text", ""), ["unlimited liability", "no cap", "notwithstanding any limitation"]):
                if _has_keyword(b.get("raw_text", ""), ["limited to", "shall not exceed", "cap on liability", "maximum liability"]):
                    contradictions.append(Contradiction(
                        a_type, b_type,
                        "Liability Cap Contradiction",
                        f"'{a_type}' appears to disclaim liability limitations while '{b_type}' imposes a cap. These provisions directly contradict each other.",
                        "high",
                    ))

            # 4. Perpetual confidentiality vs. fixed term
            if "confidential" in a_text and "confidential" in b_text:
                a_perpetual = _has_keyword(a.get("raw_text", ""), ["indefinitely", "perpetual", "no expiration", "survives"])
                b_fixed = bool(_extract_numbers(b.get("raw_text", ""))) and "year" in b_text
                if a_perpetual and b_fixed:
                    contradictions.append(Contradiction(
                        a_type, b_type,
                        "Confidentiality Term Conflict",
                        f"'{a_type}' imposes perpetual confidentiality obligations while '{b_type}' sets a fixed term. Conflicting timeframes create uncertainty.",
                        "moderate",
                    ))

            # 5. Termination vs. survival clause conflict
            if "terminat" in a_text and "surviv" in b_text:
                if _has_keyword(a.get("raw_text", ""), ["all obligations cease", "no further obligation", "terminates all"]):
                    if _has_keyword(b.get("raw_text", ""), ["survive termination", "shall survive", "continues after"]):
                        contradictions.append(Contradiction(
                            a_type, b_type,
                            "Termination vs. Survival Conflict",
                            f"'{a_type}' suggests all obligations end upon termination, but '{b_type}' contains survival provisions. This creates post-termination obligation uncertainty.",
                            "moderate",
                        ))

            # 6. IP ownership — simultaneous "work for hire" and "license back"
            if "intellectual property" in a_text or "ip" in a_text:
                if "intellectual property" in b_text or "ip" in b_text:
                    a_assign = _has_keyword(a.get("raw_text", ""), ["assign", "work for hire", "all rights"])
                    b_license = _has_keyword(b.get("raw_text", ""), ["license back", "license grant", "royalty"])
                    if a_assign and b_license:
                        contradictions.append(Contradiction(
                            a_type, b_type,
                            "IP Ownership Contradiction",
                            f"'{a_type}' appears to fully assign IP rights while '{b_type}' grants a license back. If IP is fully assigned, a license-back is legally redundant and signals drafting error.",
                            "moderate",
                        ))

    return [c.to_dict() for c in contradictions]
