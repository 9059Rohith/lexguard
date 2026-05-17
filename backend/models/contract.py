from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    contracts = relationship("Contract", back_populates="user", cascade="all, delete-orphan")
    playbooks = relationship("Playbook", back_populates="user", cascade="all, delete-orphan")


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    contract_type = Column(String, default="Unknown")
    status = Column(String, default="pending")  # pending, processing, complete, failed
    full_text = Column(Text, default="")
    page_count = Column(Integer, default=0)
    aggregate_risk_index = Column(Float, default=0.0)
    risk_level = Column(String, default="unknown")  # low, moderate, high
    high_count = Column(Integer, default=0)
    moderate_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    executive_summary = Column(Text, default="")
    scenarios_json = Column(JSON, default=list)
    contradictions_json = Column(JSON, default=list)  # Detected logical contradictions
    counterparty = Column(String, default="")  # Extracted counterparty name
    jurisdiction = Column(String, default="")  # Extracted governing law
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="contracts")
    clauses = relationship("Clause", back_populates="contract", cascade="all, delete-orphan")


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(String, primary_key=True, default=gen_uuid)
    contract_id = Column(String, ForeignKey("contracts.id"), nullable=False)
    clause_type = Column(String, nullable=False)
    raw_text = Column(Text, nullable=False)
    plain_english = Column(Text, nullable=False)
    risk_likelihood = Column(Integer, default=3)  # 1-5
    risk_severity = Column(Integer, default=3)   # 1-5
    risk_score = Column(Float, default=9.0)       # S_i = L_i × I_i (1-25)
    risk_score_adjusted = Column(Float, default=9.0)  # S_adjusted environmental modifier
    risk_level = Column(String, default="moderate")  # low, moderate, high
    requires_legal_review = Column(Boolean, default=False)
    category = Column(String, default="Operational")
    page_estimate = Column(Integer, default=1)
    bounding_box_json = Column(JSON, nullable=True)  # {x_min, y_min, x_max, y_max, page}
    redline_suggestion = Column(Text, default="")
    why_risky = Column(Text, default="")
    is_accepted = Column(Boolean, nullable=True)   # null=pending, True=accepted, False=rejected
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contract = relationship("Contract", back_populates="clauses")


class Playbook(Base):
    __tablename__ = "playbooks"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    rules = Column(JSON, default=list)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="playbooks")
