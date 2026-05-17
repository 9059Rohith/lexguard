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


@router.post("/compare")
async def compare_contracts(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    AI-powered contract comparison.
    Parses two uploaded documents then uses Groq LLM to produce clause-level diffs.
    Returns: added, removed, common clause lists + risk_delta explanation.
    """
    from services.parser import DocumentParser
    from services.groq_client import groq_client

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    upload_dir = os.path.realpath(os.path.abspath(settings.UPLOAD_DIR))
    tmp_paths: list[str] = []

    async def _parse(upload: UploadFile) -> str:
        ext = os.path.splitext(upload.filename or ".txt")[1].lower()
        if ext not in {".pdf", ".docx", ".doc", ".txt", ".rtf"}:
            ext = ".txt"
        data = await upload.read()
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File '{upload.filename}' exceeds {settings.MAX_FILE_SIZE_MB}MB limit.",
            )
        fname = f"cmp_{uuid.uuid4()}{ext}"
        fpath = os.path.join(upload_dir, fname)
        tmp_paths.append(fpath)
        with open(fpath, "wb") as fh:
            fh.write(data)
        parsed = DocumentParser.parse(fpath, upload_dir=upload_dir)
        return parsed.full_text[:40_000]

    try:
        text_a, text_b = await asyncio.gather(_parse(file_a), _parse(file_b))
    finally:
        for p in tmp_paths:
            try:
                os.unlink(p)
            except OSError:
                pass

    if not text_a.strip() or not text_b.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from one or both documents.",
        )

    COMPARE_SYSTEM = (
        "You are a senior contract attorney AI specializing in adversarial contract review.\n"
        "Compare two contract versions and identify material clause-level differences.\n"
        "Return ONLY valid JSON — no markdown fences, no extra commentary.\n"
        "Required JSON structure:\n"
        "{\n"
        '  "added": ["Clause X.X — what was added and its legal risk to the signing party"],\n'
        '  "removed": ["Clause X.X — what was removed and how that hurts the signing party"],\n'
        '  "common": ["brief description of materially unchanged provision"],\n'
        '  "risk_delta": "1-2 sentence explanation: is Version B more or less risky overall and why?",\n'
        '  "risk_changed": "increased" or "decreased" or "unchanged"\n'
        "}\n"
        "Rules:\n"
        "- Each array: 2-6 items\n"
        "- Be specific — cite section numbers if visible in the text\n"
        "- Flag as HIGH risk: mandatory arbitration added, liability expanded, broad IP transfer, "
        "non-compete extended, auto-renewal with short notice, data sharing broadened\n"
        "- Focus only on material legal changes; ignore whitespace or formatting differences"
    )

    comparison = await groq_client.complete_json(
        COMPARE_SYSTEM,
        f"CONTRACT VERSION A:\n\n{text_a}\n\n{'=' * 60}\n\nCONTRACT VERSION B:\n\n{text_b}",
        temperature=0.05,
        max_tokens=2048,
    )

    if not isinstance(comparison, dict):
        raise HTTPException(
            status_code=500,
            detail="Comparison analysis failed — please retry.",
        )

    return {
        "added": comparison.get("added", []),
        "removed": comparison.get("removed", []),
        "common": comparison.get("common", []),
        "risk_delta": comparison.get("risk_delta", ""),
        "risk_changed": comparison.get("risk_changed", "unchanged"),
    }
