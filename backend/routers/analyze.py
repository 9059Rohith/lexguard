import os
import uuid
import re
import asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.contract import User, Contract
from models.schemas import ContractOut, AnalysisStatus
from auth import get_current_user
from services.orchestrator import run_analysis_pipeline
from config import settings

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".rtf"}
# Characters that are dangerous in file names (null bytes, control chars, path separators)
_DANGEROUS_CHARS_RE = re.compile(r'[\x00-\x1f\x7f/\\:*?"<>|]')


def _sanitize_filename(name: str) -> str:
    """
    Strip path components and remove control characters / path separators.
    os.path.basename() already blocks traversal; we additionally strip
    null bytes and control characters that could corrupt DB or filesystem.
    The actual file is always saved under a UUID name, so the original
    filename is only used for display — any reasonable Unicode name is safe.
    """
    basename = os.path.basename(name or "").strip()
    # Remove dangerous characters
    basename = _DANGEROUS_CHARS_RE.sub("_", basename)
    if not basename or basename in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if len(basename) > 255:
        # Preserve extension, truncate stem
        stem, ext = os.path.splitext(basename)
        basename = stem[: 255 - len(ext)] + ext
    return basename


@router.post("/upload", response_model=ContractOut)
async def upload_contract(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate and sanitize filename (blocks path traversal)
    safe_original = _sanitize_filename(file.filename or "upload.txt")
    ext = os.path.splitext(safe_original)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate file size
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
        )

    # Save file with UUID-based name (no user-controlled paths)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(os.path.realpath(settings.UPLOAD_DIR), unique_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    # Create contract record
    contract = Contract(
        user_id=current_user.id,
        filename=unique_name,
        original_filename=safe_original,
        file_path=file_path,
        status="pending",
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)

    # Kick off background analysis
    background_tasks.add_task(run_analysis_pipeline, contract.id, file_path)

    return ContractOut.model_validate(contract)


@router.get("/status/{contract_id}", response_model=AnalysisStatus)
async def get_analysis_status(
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

    progress_map = {
        "pending": 5,
        "processing": 60,
        "complete": 100,
        "failed": 0,
    }
    message_map = {
        "pending": "Queued for analysis...",
        "processing": "AI is analyzing your contract...",
        "complete": "Analysis complete!",
        "failed": contract.error_message or "Analysis failed",
    }
    return AnalysisStatus(
        contract_id=contract_id,
        status=contract.status,
        progress=progress_map.get(contract.status, 0),
        message=message_map.get(contract.status, ""),
    )
