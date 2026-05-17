import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models.contract import User, Playbook
from models.schemas import PlaybookCreate, PlaybookUpdate, PlaybookOut
from auth import get_current_user

router = APIRouter(prefix="/api/playbooks", tags=["playbooks"])

DEFAULT_RULES = [
    {"id": "r1", "label": "Flag any non-compete longer than 1 year", "enabled": True},
    {"id": "r2", "label": "Flag automatic renewal clauses", "enabled": True},
    {"id": "r3", "label": "Alert if governing law is outside your jurisdiction", "enabled": False},
    {"id": "r4", "label": "Flag IP assignments with no carve-outs", "enabled": True},
    {"id": "r5", "label": "Flag unlimited liability clauses", "enabled": True},
    {"id": "r6", "label": "Flag mandatory arbitration clauses", "enabled": False},
    {"id": "r7", "label": "Flag clauses allowing unilateral modification", "enabled": True},
    {"id": "r8", "label": "Flag data sharing with third parties without consent", "enabled": True},
]


@router.get("", response_model=List[PlaybookOut])
async def list_playbooks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Playbook)
        .where(Playbook.user_id == current_user.id)
        .order_by(Playbook.created_at.desc())
    )
    playbooks = result.scalars().all()

    # Seed default playbooks if none exist
    if not playbooks:
        defaults = [
            Playbook(user_id=current_user.id, name="Employment Playbook",
                     description="Rules for employment contracts", rules=DEFAULT_RULES, is_active=True),
            Playbook(user_id=current_user.id, name="Privacy Playbook",
                     description="Data privacy and protection rules", rules=DEFAULT_RULES[:4]),
            Playbook(user_id=current_user.id, name="Vendor Playbook",
                     description="Vendor and supplier agreement rules", rules=DEFAULT_RULES[4:]),
        ]
        for p in defaults:
            db.add(p)
        await db.commit()
        result = await db.execute(
            select(Playbook).where(Playbook.user_id == current_user.id)
        )
        playbooks = result.scalars().all()

    return [PlaybookOut.model_validate(p) for p in playbooks]


@router.post("", response_model=PlaybookOut)
async def create_playbook(
    data: PlaybookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    playbook = Playbook(
        user_id=current_user.id,
        name=data.name,
        description=data.description or "",
        rules=[r.model_dump() for r in (data.rules or [])],
    )
    db.add(playbook)
    await db.commit()
    await db.refresh(playbook)
    return PlaybookOut.model_validate(playbook)


@router.put("/{playbook_id}", response_model=PlaybookOut)
async def update_playbook(
    playbook_id: str,
    data: PlaybookUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Playbook).where(Playbook.id == playbook_id, Playbook.user_id == current_user.id)
    )
    playbook = result.scalar_one_or_none()
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")

    if data.name is not None:
        playbook.name = data.name
    if data.description is not None:
        playbook.description = data.description
    if data.rules is not None:
        playbook.rules = [r.model_dump() for r in data.rules]
    if data.is_active is not None:
        # Deactivate all others if setting this one active
        if data.is_active:
            all_result = await db.execute(
                select(Playbook).where(Playbook.user_id == current_user.id)
            )
            for p in all_result.scalars().all():
                p.is_active = False
        playbook.is_active = data.is_active

    await db.commit()
    await db.refresh(playbook)
    return PlaybookOut.model_validate(playbook)


@router.delete("/{playbook_id}")
async def delete_playbook(
    playbook_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Playbook).where(Playbook.id == playbook_id, Playbook.user_id == current_user.id)
    )
    playbook = result.scalar_one_or_none()
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    await db.delete(playbook)
    await db.commit()
    return {"message": "Deleted"}
