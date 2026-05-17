import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models.contract import User, Contract, Clause
from models.schemas import ChatRequest
from auth import get_current_user
from services.groq_client import groq_client
from services.prompts import CHAT_SYSTEM

router = APIRouter(prefix="/api/analyze", tags=["chat"])


@router.post("/chat/{contract_id}")
async def stream_chat(
    contract_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Load contract + clauses
    result = await db.execute(
        select(Contract)
        .options(selectinload(Contract.clauses))
        .where(Contract.id == contract_id, Contract.user_id == current_user.id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if contract.status != "complete":
        raise HTTPException(status_code=400, detail="Analysis not complete yet")

    # Build context
    clauses_summary = "\n".join([
        f"- [{c.risk_level.upper()}] {c.clause_type}: {c.plain_english}"
        for c in contract.clauses[:10]
    ])
    contract_context = f"""
CONTRACT INFORMATION:
Type: {contract.contract_type}
Risk Level: {contract.risk_level.upper()} (CRI: {contract.aggregate_risk_index:.0f}/100)
High Risk Clauses: {contract.high_count} | Moderate: {contract.moderate_count} | Low: {contract.low_count}

EXECUTIVE SUMMARY:
{contract.executive_summary}

FLAGGED CLAUSES:
{clauses_summary}

FULL CONTRACT (excerpt):
{contract.full_text[:3000]}
"""
    system_with_context = CHAT_SYSTEM + f"\n\n{contract_context}"

    # Build message history
    messages = list(request.history or [])
    messages.append({"role": "user", "content": request.message})

    async def event_stream():
        try:
            async for token in groq_client.stream_chat(system_with_context, messages):
                data = json.dumps({"token": token})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
