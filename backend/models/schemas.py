from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Contract Schemas ──────────────────────────────────────────────────────────

class ContractOut(BaseModel):
    id: str
    filename: str
    original_filename: str
    contract_type: str
    status: str
    page_count: int
    aggregate_risk_index: float
    risk_level: str
    high_count: int
    moderate_count: int
    low_count: int
    executive_summary: str
    counterparty: str = ""
    jurisdiction: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}


class ContractDetail(ContractOut):
    full_text: str
    scenarios_json: Optional[List[Any]] = []
    contradictions_json: Optional[List[Any]] = []
    clauses: List["ClauseOut"] = []


# ─── Clause Schemas ────────────────────────────────────────────────────────────

class ClauseOut(BaseModel):
    id: str
    contract_id: str
    clause_type: str
    raw_text: str
    plain_english: str
    risk_likelihood: int
    risk_severity: int
    risk_score: float
    risk_score_adjusted: float = 9.0
    risk_level: str
    requires_legal_review: bool = False
    category: str
    page_estimate: int
    bounding_box_json: Optional[Any] = None
    redline_suggestion: str
    why_risky: str
    is_accepted: Optional[bool]
    order_index: int

    model_config = {"from_attributes": True}


class ClauseAcceptReject(BaseModel):
    accepted: bool


# ─── Chat Schemas ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []


# ─── Playbook Schemas ──────────────────────────────────────────────────────────

class PlaybookRule(BaseModel):
    id: str
    label: str
    enabled: bool
    value: Optional[str] = None


class PlaybookCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    rules: Optional[List[PlaybookRule]] = []


class PlaybookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[List[PlaybookRule]] = None
    is_active: Optional[bool] = None


class PlaybookOut(BaseModel):
    id: str
    name: str
    description: str
    rules: List[Any]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Analysis Status ───────────────────────────────────────────────────────────

class AnalysisStatus(BaseModel):
    contract_id: str
    status: str
    progress: int
    message: str


ContractDetail.model_rebuild()
