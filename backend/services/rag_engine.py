"""
RAG Engine — Document Chunking, Embedding & Clause Retrieval.

Architecture:
  1. Parse document → plain text (handled by parser.py)
  2. Chunk text → overlapping word-window chunks
  3. Encode chunks → sentence embeddings (all-MiniLM-L6-v2, CPU)
  4. Build FAISS index → fast cosine-similarity search
  5. For each legal clause type → retrieve top-k relevant chunks
  6. Apply rule-based keyword analysis → risk level + score

Groq is NOT called here. It is only used in orchestrator.py for the
final executive summary generation.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Clause type → semantic search queries
# ---------------------------------------------------------------------------
CLAUSE_QUERIES: Dict[str, List[str]] = {
    "liability": [
        "liability indemnification damages responsibility claims",
        "indemnify hold harmless defend losses legal claims",
    ],
    "payment": [
        "payment fees invoicing billing compensation amount due",
        "payment terms due date late payment penalty interest",
    ],
    "termination": [
        "termination cancellation end agreement notice period",
        "right to terminate for cause or convenience without notice",
    ],
    "intellectual_property": [
        "intellectual property ownership copyright patent trademark assignment",
        "IP rights work product created under agreement assign",
    ],
    "confidentiality": [
        "confidential information non-disclosure NDA trade secrets",
        "confidentiality obligation disclosure restriction proprietary",
    ],
    "governing_law": [
        "governing law jurisdiction court venue choice of law applicable",
        "laws of state govern agreement dispute resolution forum",
    ],
    "force_majeure": [
        "force majeure act of god unforeseen circumstances beyond control",
        "delay performance excused natural disaster pandemic strike",
    ],
    "warranty": [
        "warranty representation guarantee merchantability fitness purpose",
        "warrants represents covenants disclaimer as-is no warranty",
    ],
    "limitation_of_liability": [
        "limitation of liability cap maximum damages consequential",
        "shall not exceed total fees paid indirect special punitive damages",
    ],
    "data_protection": [
        "data protection privacy GDPR personal data processing security",
        "data breach notification privacy policy personal information",
    ],
    "non_compete": [
        "non-compete non-solicitation restrictive covenant employee",
        "compete with business solicit customers employees restriction",
    ],
    "dispute_resolution": [
        "dispute resolution arbitration mediation binding process",
        "claims disputes controversies arbitration clause waiver jury",
    ],
}

# ---------------------------------------------------------------------------
# Keyword patterns for rule-based risk classification
# ---------------------------------------------------------------------------
HIGH_RISK_KEYWORDS: Dict[str, List[str]] = {
    "liability": [
        "unlimited liability",
        "indemnify and hold harmless",
        "joint and several liability",
        "unlimited indemnification",
        "gross negligence",
    ],
    "payment": [
        "automatic renewal",
        "unilateral price increase",
        "interest on overdue",
        "payment upon demand",
        "non-refundable",
    ],
    "termination": [
        "termination for convenience",
        "immediate termination",
        "without cause",
        "no notice required",
        "sole discretion",
    ],
    "intellectual_property": [
        "assign all ip",
        "all rights assigned",
        "perpetual irrevocable",
        "work for hire",
        "all intellectual property",
    ],
    "confidentiality": [
        "perpetual confidentiality",
        "no expiration",
        "unlimited scope",
        "survives indefinitely",
    ],
    "limitation_of_liability": [
        "no limitation",
        "unlimited liability",
        "exclusion does not apply",
        "notwithstanding any limitation",
    ],
    "non_compete": [
        "worldwide",
        "unlimited duration",
        "any competing business",
        "5 years",
        "10 years",
    ],
    "data_protection": [
        "sell personal data",
        "share without consent",
        "no breach notification",
        "unlimited data use",
        "third party without restriction",
    ],
    "warranty": [
        "as-is",
        "no warranty",
        "disclaim all warranties",
        "without any warranty",
    ],
    "governing_law": [
        "waive right to jury",
        "mandatory arbitration",
        "class action waiver",
    ],
    "dispute_resolution": [
        "waive right to jury trial",
        "class action waiver",
        "binding arbitration only",
        "no appeal",
    ],
}

MODERATE_RISK_KEYWORDS: Dict[str, List[str]] = {
    "liability": ["indemnification", "hold harmless", "consequential damages", "defend"],
    "payment": ["renewal", "price adjustment", "late payment", "interest rate"],
    "termination": ["30 days notice", "60 days", "termination notice", "cure period"],
    "intellectual_property": ["license grant", "sublicense", "derivative works", "license back"],
    "confidentiality": ["3 years", "5 years", "confidential information", "nda"],
    "limitation_of_liability": ["limited to fees paid", "cap on liability", "12 months fees"],
    "non_compete": ["12 months", "24 months", "geographic restriction", "same industry"],
    "data_protection": ["data sharing", "third party processors", "data retention", "cookies"],
    "warranty": ["limited warranty", "best efforts", "fitness for purpose"],
    "governing_law": ["out of state", "foreign jurisdiction", "arbitration"],
    "force_majeure": ["limited force majeure", "narrow definition", "excludes pandemic"],
    "dispute_resolution": ["arbitration", "mediation required", "notice of dispute"],
}

# ---------------------------------------------------------------------------
# Static clause metadata (plain English + why risky)
# ---------------------------------------------------------------------------
CLAUSE_PLAIN_ENGLISH: Dict[str, str] = {
    "liability": "Determines who is financially responsible if something goes wrong during the contract.",
    "payment": "Specifies when, how, and how much you must pay, including penalties for late payment.",
    "termination": "Outlines conditions under which either party can end the agreement.",
    "intellectual_property": "Defines who owns the work, ideas, or inventions created during this contract.",
    "confidentiality": "Requires you to keep certain information secret and not share it with others.",
    "governing_law": "Specifies which state or country's laws apply if there is a legal dispute.",
    "force_majeure": "Excuses performance when unforeseeable events (like natural disasters) occur.",
    "warranty": "Promises made about the quality or fitness of services/products provided.",
    "limitation_of_liability": "Caps the maximum amount either party can claim in damages.",
    "data_protection": "Governs how personal or sensitive data is collected, used, and protected.",
    "non_compete": "Restricts your ability to work for competitors or start a competing business.",
    "dispute_resolution": "Dictates how disagreements must be resolved — through courts or arbitration.",
}

WHY_RISKY: Dict[str, Dict[str, str]] = {
    "liability": {
        "high": "Unlimited liability exposure could result in catastrophic financial damages with no enforceable cap.",
        "moderate": "Broad indemnification obligations may require you to cover legal costs for third-party claims.",
        "low": "Standard liability terms with reasonable limitations appropriate to this contract type.",
    },
    "payment": {
        "high": "Automatic renewals or unilateral price increases could lock you into unfavorable financial terms.",
        "moderate": "Late payment penalties and renewal clauses require careful monitoring and calendar management.",
        "low": "Standard payment terms with clear due dates and reasonable late-payment provisions.",
    },
    "termination": {
        "high": "The other party can terminate immediately without notice, leaving you with no recourse or transition time.",
        "moderate": "Termination provisions may favor the other party with asymmetric notice requirements.",
        "low": "Balanced termination rights with reasonable notice periods protecting both parties.",
    },
    "intellectual_property": {
        "high": "You may permanently lose ownership of all IP created during this contract — including pre-existing work.",
        "moderate": "Broad license grants may limit your ability to use derivative works outside this engagement.",
        "low": "Standard IP provisions with clear ownership delineation between parties.",
    },
    "confidentiality": {
        "high": "Perpetual, unlimited confidentiality obligations can restrict your business operations indefinitely.",
        "moderate": "Multi-year confidentiality requirements may impact future business activities and hiring.",
        "low": "Standard confidentiality terms with reasonable duration and scope.",
    },
    "governing_law": {
        "high": "Mandatory arbitration or unfavorable jurisdiction waives important legal rights and increases costs.",
        "moderate": "Out-of-state jurisdiction may significantly increase litigation costs if disputes arise.",
        "low": "Neutral jurisdiction with standard dispute resolution provisions.",
    },
    "force_majeure": {
        "high": "Narrow force majeure definition may leave you obligated to perform during genuine emergencies.",
        "moderate": "Limited force majeure scope may not cover all foreseeable disruptive events.",
        "low": "Comprehensive force majeure provisions covering standard unforeseeable events.",
    },
    "warranty": {
        "high": "Complete warranty disclaimer leaves you with no recourse if services or products fail to perform.",
        "moderate": "Limited warranty scope may not adequately protect your interests for critical deliverables.",
        "low": "Standard warranty terms with appropriate protections and remedies.",
    },
    "limitation_of_liability": {
        "high": "Carve-outs may render the liability cap unenforceable in the most critical damage scenarios.",
        "moderate": "The liability cap may be insufficient to cover actual damages sustained.",
        "low": "Reasonable liability limitations that balance risk appropriately between both parties.",
    },
    "data_protection": {
        "high": "Inadequate data protection provisions expose you to regulatory fines and reputational damage.",
        "moderate": "Data sharing with third parties may create compliance obligations under GDPR/CCPA.",
        "low": "Standard data protection measures appropriate for the data types involved.",
    },
    "non_compete": {
        "high": "Overly broad restrictions could significantly limit your future career or business opportunities.",
        "moderate": "Non-compete terms may restrict certain business activities for a defined period.",
        "low": "Reasonable non-compete restrictions within industry norms and geographic scope.",
    },
    "dispute_resolution": {
        "high": "Mandatory binding arbitration waives your right to jury trial and may heavily favor the drafter.",
        "moderate": "Arbitration requirements may add cost and procedural complexity to dispute resolution.",
        "low": "Standard dispute resolution procedures that are fair and accessible to both parties.",
    },
}

CATEGORY_MAP: Dict[str, str] = {
    "liability": "Financial",
    "payment": "Financial",
    "termination": "Operational",
    "intellectual_property": "IP & Ownership",
    "confidentiality": "Privacy & Security",
    "governing_law": "Legal & Compliance",
    "force_majeure": "Risk Management",
    "warranty": "Quality & Standards",
    "limitation_of_liability": "Financial",
    "data_protection": "Privacy & Security",
    "non_compete": "Operational",
    "dispute_resolution": "Legal & Compliance",
}

# Contract-type keyword detection (no LLM required)
CONTRACT_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "Employment Agreement": ["employment", "employee", "employer", "salary", "wages", "at-will"],
    "Software License Agreement": ["software license", "saas", "subscription", "end user", "open source"],
    "Non-Disclosure Agreement": ["non-disclosure", "nda", "confidentiality agreement", "proprietary information"],
    "Service Agreement": ["services", "service provider", "statement of work", "deliverables", "professional services"],
    "Vendor Agreement": ["vendor", "supplier", "purchase order", "procurement", "goods"],
    "Lease Agreement": ["lease", "lessor", "lessee", "rent", "premises", "property"],
    "Partnership Agreement": ["partnership", "general partner", "limited partner", "profit sharing"],
    "Investment Agreement": ["investment", "investor", "equity", "shares", "valuation", "cap table"],
    "Consulting Agreement": ["consulting", "consultant", "independent contractor", "retainer"],
    "Terms of Service": ["terms of service", "terms and conditions", "user agreement", "acceptable use"],
}


# ---------------------------------------------------------------------------
# RAG Engine class
# ---------------------------------------------------------------------------
class RAGEngine:
    """
    Lightweight semantic search engine for legal contract analysis.
    Uses sentence-transformers (CPU) + FAISS for embedding & retrieval.
    """

    # Class-level model cache — loaded once per process
    _model = None

    def __init__(self) -> None:
        self.chunks: List[str] = []
        self.index = None  # faiss.IndexFlatIP

    @classmethod
    def _get_model(cls):
        if cls._model is None:
            from sentence_transformers import SentenceTransformer

            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model

    # ------------------------------------------------------------------
    # Chunking
    # ------------------------------------------------------------------
    def _chunk_text(
        self,
        text: str,
        max_words: int = 150,
        overlap_words: int = 40,
    ) -> List[str]:
        """Split text into overlapping word-window chunks preserving paragraph boundaries."""
        # First split by paragraph for semantic coherence
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\r\n\s*\r\n", text) if p.strip()]

        chunks: List[str] = []
        for para in paragraphs:
            words = para.split()
            if not words:
                continue
            if len(words) <= max_words:
                chunks.append(para)
            else:
                start = 0
                while start < len(words):
                    end = min(start + max_words, len(words))
                    chunks.append(" ".join(words[start:end]))
                    start += max_words - overlap_words

        return [c for c in chunks if len(c.split()) >= 10]  # discard tiny fragments

    # ------------------------------------------------------------------
    # Index building
    # ------------------------------------------------------------------
    def build_index(self, text: str) -> None:
        """Chunk document and build FAISS cosine-similarity index."""
        import faiss

        self.chunks = self._chunk_text(text)
        if not self.chunks:
            self.index = None
            return

        model = self._get_model()
        embeddings = model.encode(self.chunks, show_progress_bar=False, batch_size=32)
        embeddings = np.array(embeddings, dtype="float32")
        faiss.normalize_L2(embeddings)

        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------
    def retrieve(self, query: str, k: int = 5, threshold: float = 0.18) -> List[Tuple[str, float]]:
        """Return top-k chunks most similar to *query* (cosine similarity ≥ threshold)."""
        import faiss

        if self.index is None or not self.chunks:
            return []

        model = self._get_model()
        query_emb = model.encode([query], show_progress_bar=False)
        query_emb = np.array(query_emb, dtype="float32")
        faiss.normalize_L2(query_emb)

        k_actual = min(k, len(self.chunks))
        scores, indices = self.index.search(query_emb, k_actual)

        results: List[Tuple[str, float]] = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and float(score) >= threshold:
                results.append((self.chunks[int(idx)], float(score)))
        return results

    # ------------------------------------------------------------------
    # Risk classification
    # ------------------------------------------------------------------
    def _classify_risk(self, text: str, clause_key: str) -> Tuple[str, int, int]:
        """
        Keyword-based risk classification.
        Returns (risk_level, likelihood 1-10, severity 1-10).
        """
        t = text.lower()

        for kw in HIGH_RISK_KEYWORDS.get(clause_key, []):
            if kw.lower() in t:
                return "high", 8, 8

        for kw in MODERATE_RISK_KEYWORDS.get(clause_key, []):
            if kw.lower() in t:
                return "moderate", 5, 5

        return "low", 2, 3

    # ------------------------------------------------------------------
    # Redline suggestion generator
    # ------------------------------------------------------------------
    @staticmethod
    def _redline(clause_key: str, display_name: str, risk_level: str) -> Optional[str]:
        if risk_level == "high":
            return (
                f"SUGGESTED REVISION: Negotiate to strictly limit the scope of this {display_name} clause. "
                f"Add mutual obligations, an explicit liability cap, and 30-day cure periods. "
                f"Recommended language: 'Each party's total liability shall not exceed the aggregate fees paid "
                f"in the twelve (12) months preceding the claim, excluding gross negligence or wilful misconduct.'"
            )
        if risk_level == "moderate":
            return (
                f"SUGGESTED REVISION: Clarify the scope and duration of this {display_name} provision and "
                f"ensure reciprocal obligations apply equally to both parties."
            )
        return None

    # ------------------------------------------------------------------
    # Scenario generator (rule-based, no LLM)
    # ------------------------------------------------------------------
    @staticmethod
    def generate_scenarios(clauses: List[Dict]) -> List[Dict]:
        """Generate what-if scenarios from high/moderate risk clauses."""
        scenarios: List[Dict] = []

        for clause in clauses:
            if clause.get("risk_level") not in ("high", "moderate"):
                continue
            if len(scenarios) >= 4:
                break

            ctype = clause.get("clause_type", "Contract")
            risk_level = clause.get("risk_level", "moderate")
            why = clause.get("why_risky", "")
            redline = clause.get("redline_suggestion") or "Negotiate improved terms before signing."

            scenarios.append(
                {
                    "title": f"{ctype} Clause Triggered",
                    "description": (
                        f"Scenario: The {ctype} provision is invoked by the counterparty. "
                        f"{why}"
                    ),
                    "severity": risk_level,
                    "financial_impact": (
                        "Potentially significant financial exposure — engage legal counsel immediately."
                        if risk_level == "high"
                        else "Moderate financial impact; budget for potential dispute resolution costs."
                    ),
                    "mitigation": redline,
                }
            )

        # Always include a general scenario
        scenarios.append(
            {
                "title": "Dispute Resolution Timeline",
                "description": (
                    "In the event of a contract dispute, arbitration or litigation typically takes "
                    "6–24 months. Ensure all obligations are documented contemporaneously."
                ),
                "severity": "medium",
                "financial_impact": "$10,000–$500,000 in legal fees depending on complexity and jurisdiction.",
                "mitigation": (
                    "Ensure the dispute resolution clause includes mediation as a mandatory first step "
                    "before proceeding to binding arbitration or litigation."
                ),
            }
        )
        return scenarios[:5]

    # ------------------------------------------------------------------
    # Contract-type detection (keyword-based, no LLM)
    # ------------------------------------------------------------------
    @staticmethod
    def detect_contract_type(text: str) -> str:
        text_lower = text.lower()
        best_match = "General Commercial Agreement"
        best_count = 0

        for contract_type, keywords in CONTRACT_TYPE_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw.lower() in text_lower)
            if count > best_count:
                best_count = count
                best_match = contract_type

        return best_match

    # ------------------------------------------------------------------
    # Main extraction entry point
    # ------------------------------------------------------------------
    def extract_clauses(self, text: str) -> List[Dict]:
        """
        Full RAG clause extraction pipeline:
          1. Build FAISS index over document chunks
          2. For each clause type, retrieve semantically relevant chunks
          3. Apply rule-based risk classification
          4. Return structured clause list
        """
        self.build_index(text)

        clauses: List[Dict] = []
        seen_texts: set = set()
        order_idx = 0

        for clause_key, queries in CLAUSE_QUERIES.items():
            # Gather candidates from all queries for this clause type
            candidates: List[Tuple[str, float]] = []
            for query in queries:
                candidates.extend(self.retrieve(query, k=4))

            if not candidates:
                continue

            # Deduplicate and keep top-2 by score
            seen_for_type: set = set()
            best: List[Tuple[str, float]] = []
            for chunk, score in sorted(candidates, key=lambda x: x[1], reverse=True):
                if chunk not in seen_texts and chunk not in seen_for_type:
                    best.append((chunk, score))
                    seen_for_type.add(chunk)
                    if len(best) >= 2:
                        break

            if not best:
                continue

            # Use highest-score chunk as primary text
            raw_text = best[0][0]
            if raw_text in seen_texts:
                continue
            seen_texts.add(raw_text)

            # Combined context for risk analysis
            combined = " ".join(c for c, _ in best)

            risk_level, likelihood, severity = self._classify_risk(combined, clause_key)
            risk_score = float(likelihood * severity)

            display_name = clause_key.replace("_", " ").title()
            plain_english = CLAUSE_PLAIN_ENGLISH.get(
                clause_key, "This clause affects your rights and obligations under the contract."
            )
            why_risky = WHY_RISKY.get(clause_key, {}).get(
                risk_level, "Review this clause carefully with legal counsel."
            )
            redline = self._redline(clause_key, display_name, risk_level)

            clauses.append(
                {
                    "clause_type": display_name,
                    "raw_text": raw_text[:2000],
                    "plain_english": plain_english,
                    "risk_likelihood": likelihood,
                    "risk_severity": severity,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "category": CATEGORY_MAP.get(clause_key, "General"),
                    "page_estimate": 1,
                    "redline_suggestion": redline,
                    "why_risky": why_risky,
                    "is_accepted": None,
                    "order_index": order_idx,
                }
            )
            order_idx += 1

        return clauses


# Module-level singleton (model loaded lazily on first use)
rag_engine = RAGEngine()
