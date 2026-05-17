from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models.contract import User, Contract, Clause
from auth import get_current_user
from services.report_builder import build_redlined_docx, build_risk_report_pdf

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/docx/{contract_id}")
async def export_docx(
    contract_id: str,
    accepted_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contract)
        .options(selectinload(Contract.clauses))
        .where(Contract.id == contract_id, Contract.user_id == current_user.id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.status != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete")

    clauses_data = [
        {
            "clause_type": c.clause_type,
            "raw_text": c.raw_text,
            "plain_english": c.plain_english,
            "risk_level": c.risk_level,
            "risk_score": c.risk_score,
            "why_risky": c.why_risky,
            "redline_suggestion": c.redline_suggestion,
            "is_accepted": c.is_accepted,
        }
        for c in sorted(contract.clauses, key=lambda x: x.risk_score, reverse=True)
    ]

    docx_bytes = build_redlined_docx(
        contract_filename=contract.original_filename,
        clauses=clauses_data,
        accepted_only=accepted_only,
    )
    safe_name = contract.original_filename.rsplit(".", 1)[0]
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_redlines.docx"'},
    )


@router.get("/pdf/{contract_id}")
async def export_pdf(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contract)
        .options(selectinload(Contract.clauses))
        .where(Contract.id == contract_id, Contract.user_id == current_user.id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.status != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete")

    contract_dict = {
        "original_filename": contract.original_filename,
        "contract_type": contract.contract_type,
        "created_at": str(contract.created_at),
        "risk_level": contract.risk_level,
        "aggregate_risk_index": contract.aggregate_risk_index,
        "high_count": contract.high_count,
        "moderate_count": contract.moderate_count,
        "low_count": contract.low_count,
        "executive_summary": contract.executive_summary,
    }
    clauses_data = [
        {
            "clause_type": c.clause_type,
            "plain_english": c.plain_english,
            "risk_level": c.risk_level,
            "risk_score": c.risk_score,
            "category": c.category,
            "why_risky": c.why_risky,
        }
        for c in sorted(contract.clauses, key=lambda x: x.risk_score, reverse=True)
    ]

    pdf_bytes = build_risk_report_pdf(contract_dict, clauses_data)
    safe_name = contract.original_filename.rsplit(".", 1)[0]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}_risk_report.pdf"'},
    )
