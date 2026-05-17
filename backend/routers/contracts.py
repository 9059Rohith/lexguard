from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List

from database import get_db
from models.contract import User, Contract, Clause
from models.schemas import ContractOut, ContractDetail, ClauseOut, ClauseAcceptReject
from auth import get_current_user

router = APIRouter(prefix="/api", tags=["contracts"])


@router.get("/contracts", response_model=List[ContractOut])
async def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = None,
    contract_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Contract).where(Contract.user_id == current_user.id)
    if risk_level:
        query = query.where(Contract.risk_level == risk_level)
    if contract_type:
        query = query.where(Contract.contract_type.ilike(f"%{contract_type}%"))
    query = query.order_by(Contract.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    contracts = result.scalars().all()
    return [ContractOut.model_validate(c) for c in contracts]


@router.get("/analyze/results/{contract_id}", response_model=ContractDetail)
async def get_results(
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

    return ContractDetail.model_validate(contract)


@router.delete("/contracts/{contract_id}")
async def delete_contract(
    contract_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.user_id == current_user.id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    await db.delete(contract)
    await db.commit()
    return {"message": "Contract deleted successfully"}


@router.patch("/clauses/{clause_id}/accept")
async def accept_clause(
    clause_id: str,
    data: ClauseAcceptReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Clause)
        .join(Contract)
        .where(Clause.id == clause_id, Contract.user_id == current_user.id)
    )
    clause = result.scalar_one_or_none()
    if not clause:
        raise HTTPException(status_code=404, detail="Clause not found")

    clause.is_accepted = data.accepted
    await db.commit()
    return {"message": "Updated", "clause_id": clause_id, "accepted": data.accepted}


@router.get("/contracts/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await db.scalar(
        select(func.count()).where(Contract.user_id == current_user.id)
    )
    high_risk = await db.scalar(
        select(func.count()).where(
            Contract.user_id == current_user.id,
            Contract.risk_level == "high"
        )
    )
    avg_score_result = await db.scalar(
        select(func.avg(Contract.aggregate_risk_index)).where(
            Contract.user_id == current_user.id,
            Contract.status == "complete"
        )
    )
    total_clauses = await db.scalar(
        select(func.count(Clause.id))
        .join(Contract)
        .where(Contract.user_id == current_user.id)
    )
    return {
        "total_contracts": total or 0,
        "high_risk_contracts": high_risk or 0,
        "average_risk_score": round(avg_score_result or 0, 1),
        "total_clauses_flagged": total_clauses or 0,
    }
