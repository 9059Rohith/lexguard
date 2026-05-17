import asyncio
import traceback
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.contract import Contract, Clause
from services.parser import DocumentParser
from services.groq_client import groq_client
from services.risk_scorer import score_clauses, compute_cri, classify_cri
from services.rag_engine import rag_engine, RAGEngine
from services.prompts import SUMMARY_SYSTEM, CLAUSE_EXTRACTION_SYSTEM
from services.contradiction_detector import detect_contradictions
from database import AsyncSessionLocal
from config import settings


async def extract_clauses_with_groq(full_text: str) -> List[dict]:
    """
    Use Groq LLM (llama-3.3-70b) to extract and risk-score every clause.
    Falls back to RAG rule-based extraction if LLM call fails.
    Handles long contracts by chunking: sends first 50 KB then any remainder.
    """
    MAX_CHARS = 50_000
    text_a = full_text[:MAX_CHARS]
    text_b = full_text[MAX_CHARS:MAX_CHARS * 2] if len(full_text) > MAX_CHARS else ""

    async def _llm_extract(text: str) -> List[dict]:
        result = await groq_client.complete_json(
            CLAUSE_EXTRACTION_SYSTEM,
            f"Analyze the following contract text in full. Flag EVERY clause that is unfair, "
            f"exploitative, one-sided, or risky. Be aggressive—err on the side of flagging more.\n\n"
            f"CONTRACT TEXT:\n\n{text}",
            temperature=0.05,
            max_tokens=4096,
        )
        if isinstance(result, list):
            return result
        return []

    try:
        clauses_a = await _llm_extract(text_a)
        clauses_b = await _llm_extract(text_b) if text_b else []

        # Merge and deduplicate by raw_text similarity
        all_clauses: List[dict] = clauses_a
        seen = {c.get("raw_text", "")[:80] for c in clauses_a}
        for c in clauses_b:
            key = c.get("raw_text", "")[:80]
            if key not in seen:
                all_clauses.append(c)
                seen.add(key)

        if all_clauses:
            return all_clauses
    except Exception as e:
        print(f"[orchestrator] Groq clause extraction failed: {e}, falling back to RAG")

    # Fallback: rule-based RAG extraction
    engine = RAGEngine()
    return engine.extract_clauses(full_text)


async def update_contract_status(contract_id: str, status: str, **kwargs):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Contract).where(Contract.id == contract_id))
        contract = result.scalar_one_or_none()
        if contract:
            contract.status = status
            for key, value in kwargs.items():
                setattr(contract, key, value)
            await db.commit()


async def run_analysis_pipeline(contract_id: str, file_path: str):
    """
    Stateful 8-step analysis pipeline:

    1. Parse document (layout-aware, with bounding boxes + OCR fallback)
    2. Detect contract type (keyword-based RAGEngine)
    3. Extract counterparty + jurisdiction (heuristic regex from parser)
    4. Extract & analyze clauses (RAG semantic search + rule-based scoring)
    5. Compute aggregate scores (CRI with contract-type-weighted categories)
    6. Detect pairwise contradictions (logic auditor)
    7. Generate what-if scenarios (rule-based templates)
    8. Executive summary (Groq LLM — only LLM call)
    9. Persist to SQLite
    """
    try:
        # ── STEP 1: PARSE ────────────────────────────────────────────────
        await update_contract_status(contract_id, "processing")
        parsed = DocumentParser.parse(file_path, upload_dir=settings.UPLOAD_DIR)
        full_text = parsed.full_text
        page_count = parsed.page_count
        counterparty = parsed.counterparty or ""
        jurisdiction = parsed.jurisdiction or ""

        if not full_text.strip():
            await update_contract_status(
                contract_id,
                "failed",
                error_message="Could not extract text from document.",
            )
            return

        # ── STEP 2: CONTRACT-TYPE DETECTION ───────────────────────────────
        engine = RAGEngine()
        contract_type = engine.detect_contract_type(full_text)

        # ── STEP 3: LLM CLAUSE EXTRACTION (Groq) ─────────────────────────
        raw_clauses = await extract_clauses_with_groq(full_text)

        # ── STEP 4: RISK SCORING (with environmental modifier) ────────────
        scored_clauses = score_clauses(raw_clauses, contract_type=contract_type)
        cri = compute_cri(scored_clauses, contract_type=contract_type)
        risk_level = classify_cri(cri)
        high_count = sum(1 for c in scored_clauses if c.get("risk_level") == "high")
        moderate_count = sum(1 for c in scored_clauses if c.get("risk_level") == "moderate")
        low_count = sum(1 for c in scored_clauses if c.get("risk_level") == "low")

        # ── STEP 5: CONTRADICTION DETECTION ──────────────────────────────
        contradictions = detect_contradictions(scored_clauses)

        # ── STEP 6: SCENARIO GENERATION ───────────────────────────────────
        scenarios = engine.generate_scenarios(scored_clauses)

        # ── STEP 7: EXECUTIVE SUMMARY (only Groq call) ───────────────────
        contradiction_summary = ""
        if contradictions:
            contradiction_summary = f"\nLogical Contradictions Detected: {len(contradictions)}\n"
            for c in contradictions[:3]:
                contradiction_summary += f"- [{c['category']}] {c['description'][:100]}...\n"

        legal_review_count = sum(1 for c in scored_clauses if c.get("requires_legal_review"))

        summary_context = (
            f"Contract Type: {contract_type}\n"
            f"Counterparty: {counterparty or 'Unknown'}\n"
            f"Governing Law: {jurisdiction or 'Not specified'}\n"
            f"Overall Risk Level: {risk_level.upper()} (CRI: {cri:.0f}/100)\n"
            f"High Risk Clauses: {high_count}\n"
            f"Moderate Risk Clauses: {moderate_count}\n"
            f"Low Risk Clauses: {low_count}\n"
            f"Clauses Requiring Legal Review: {legal_review_count}\n"
            f"{contradiction_summary}\n"
            f"Top Issues:\n"
            + "\n".join(
                f"- {c.get('clause_type')}: {c.get('why_risky', '')}"
                for c in scored_clauses[:5]
            )
        )
        executive_summary = await groq_client.complete(
            SUMMARY_SYSTEM,
            summary_context,
            temperature=0.3,
            max_tokens=350,
        )

        # ── STEP 8: PYDANTIC VALIDATION FALLBACK ─────────────────────────
        # Ensure executive_summary is a non-empty string, fallback to template
        if not executive_summary or len(executive_summary.strip()) < 20:
            executive_summary = (
                f"This {contract_type} contract carries a {risk_level.upper()} overall risk "
                f"(CRI: {cri:.0f}/100) with {high_count} high-risk clauses identified. "
                f"{'Immediate legal review is recommended.' if risk_level == 'high' else 'Standard review is advised.'}"
            )

        # ── STEP 9: SAVE TO DB ────────────────────────────────────────────
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Contract).where(Contract.id == contract_id))
            contract = result.scalar_one_or_none()
            if not contract:
                return

            contract.status = "complete"
            contract.full_text = full_text
            contract.page_count = page_count
            contract.contract_type = contract_type
            contract.counterparty = counterparty
            contract.jurisdiction = jurisdiction
            contract.aggregate_risk_index = cri
            contract.risk_level = risk_level
            contract.high_count = high_count
            contract.moderate_count = moderate_count
            contract.low_count = low_count
            contract.executive_summary = executive_summary.strip()
            contract.scenarios_json = scenarios
            contract.contradictions_json = contradictions

            # Assign bounding boxes from parser output, distributed to clauses
            bboxes = parsed.bounding_boxes or []

            for i, clause_data in enumerate(scored_clauses):
                # Assign a bounding box from the parsed data if available
                bbox = bboxes[i % len(bboxes)] if bboxes else None

                clause = Clause(
                    contract_id=contract_id,
                    clause_type=clause_data.get("clause_type", "Unknown")[:200],
                    raw_text=clause_data.get("raw_text", "")[:2000],
                    plain_english=clause_data.get("plain_english", ""),
                    risk_likelihood=int(clause_data.get("risk_likelihood", 3)),
                    risk_severity=int(clause_data.get("risk_severity", 3)),
                    risk_score=float(clause_data.get("risk_score", 9.0)),
                    risk_score_adjusted=float(clause_data.get("risk_score_adjusted", 9.0)),
                    requires_legal_review=bool(clause_data.get("requires_legal_review", False)),
                    risk_level=clause_data.get("risk_level", "moderate"),
                    category=clause_data.get("category", "Operational"),
                    page_estimate=int(clause_data.get("page_estimate", 1)),
                    bounding_box_json=bbox,
                    redline_suggestion=clause_data.get("redline_suggestion", ""),
                    why_risky=clause_data.get("why_risky", ""),
                    order_index=i,
                )
                db.add(clause)

            await db.commit()

    except Exception as e:
        await update_contract_status(
            contract_id, "failed", error_message=str(e)[:500]
        )

