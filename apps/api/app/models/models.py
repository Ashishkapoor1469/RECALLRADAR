import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, default=generate_uuid)
    external_id = Column(String, index=True, nullable=True)
    name = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=True, index=True)
    category = Column(String, nullable=False, index=True)
    subcategory = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    safety_reports = relationship("SafetyReport", back_populates="product", cascade="all, delete-orphan")
    recalls = relationship("Recall", back_populates="product", cascade="all, delete-orphan")
    risk_snapshots = relationship("ProductRiskSnapshot", back_populates="product", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="product", cascade="all, delete-orphan")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    external_id = Column(String, index=True, nullable=True)
    rating = Column(Float, nullable=False)
    title = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    review_date = Column(DateTime, nullable=False, index=True)
    verified = Column(Boolean, default=True)
    source = Column(String, default="amazon", index=True)
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")
    safety_signals = relationship("SafetySignal", back_populates="review")


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    external_id = Column(String, index=True, nullable=True)
    report_date = Column(DateTime, nullable=False, index=True)
    description = Column(Text, nullable=False)
    product_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    severity = Column(Integer, default=1)
    source = Column(String, default="saferproducts", index=True)
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="safety_reports")
    safety_signals = relationship("SafetySignal", back_populates="report")


class Recall(Base):
    __tablename__ = "recalls"

    id = Column(String, primary_key=True, default=generate_uuid)
    external_id = Column(String, index=True, nullable=True)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    recall_date = Column(DateTime, nullable=False, index=True)
    announcement_date = Column(DateTime, nullable=True)
    description = Column(Text, nullable=True)
    hazard = Column(Text, nullable=True)
    remedy = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    source = Column(String, default="cpsc", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="recalls")


class SafetySignal(Base):
    __tablename__ = "safety_signals"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(String, ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    report_id = Column(String, ForeignKey("safety_reports.id", ondelete="SET NULL"), nullable=True)
    signal_type = Column(String, nullable=False, index=True) # e.g. "burn", "fire", "overheat"
    phrase = Column(String, nullable=False)
    severity = Column(Integer, default=1) # 0 to 4
    confidence = Column(Float, default=1.0)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    extra_metadata = Column(JSON, nullable=True)

    review = relationship("Review", back_populates="safety_signals")
    report = relationship("SafetyReport", back_populates="safety_signals")


class ProductRiskSnapshot(Base):
    __tablename__ = "product_risk_snapshots"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    snapshot_date = Column(DateTime, nullable=False, index=True)
    risk_score = Column(Float, nullable=False) # 0 to 100
    confidence = Column(Float, default=0.5)
    signal_count = Column(Integer, default=0)
    review_velocity = Column(Float, default=0.0)
    severity_score = Column(Float, default=0.0)
    semantic_risk = Column(Float, default=0.0)
    source_agreement = Column(Float, default=0.0)
    model_version = Column(String, default="risk-v1.0")
    contributors = Column(JSON, nullable=True) # Additive score breakdowns
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="risk_snapshots")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String, nullable=False, index=True) # e.g., "THRESHOLD_EXCEEDED", "VELOCITY_SPIKE"
    threshold = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    confidence = Column(String, default="Medium") # High, Medium, Low
    confidence_score = Column(Float, default=0.7)
    triggered_at = Column(DateTime, nullable=False, index=True)
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, RESOLVED, DISMISSED
    explanation = Column(JSON, nullable=True)
    model_version = Column(String, default="alert-v1.0")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="alerts")
    evidence_items = relationship("AlertEvidence", back_populates="alert", cascade="all, delete-orphan")


class AlertEvidence(Base):
    __tablename__ = "alert_evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    alert_id = Column(String, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(String, ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    report_id = Column(String, ForeignKey("safety_reports.id", ondelete="SET NULL"), nullable=True)
    evidence_text = Column(Text, nullable=False)
    danger_phrase = Column(String, nullable=True)
    relevance_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    alert = relationship("Alert", back_populates="evidence_items")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    rule_type = Column(String, nullable=False, default="CUSTOM")
    configuration = Column(JSON, nullable=False) # JSON spec for rule evaluation
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    alert_budget = Column(Integer, default=25)
    model_version = Column(String, default="risk-v1.0")
    configuration = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    results = relationship("BacktestResult", back_populates="run", cascade="all, delete-orphan")


class BacktestResult(Base):
    __tablename__ = "backtest_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, ForeignKey("backtest_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    recall_date = Column(DateTime, nullable=True)
    first_alert_date = Column(DateTime, nullable=True)
    lead_time_days = Column(Float, nullable=True)
    lead_time_weeks = Column(Float, nullable=True)
    false_alarm = Column(Boolean, default=False)
    category = Column(String, nullable=True)
    confidence = Column(String, default="Medium")

    run = relationship("BacktestRun", back_populates="results")
    product = relationship("Product")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False) # user, assistant, system
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True) # evidence citations
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class ReviewSignal(Base):
    __tablename__ = "review_signals"

    id = Column(String, primary_key=True, default=generate_uuid)
    review_id = Column(String, ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String, nullable=False, index=True) # e.g. "cable noise", "crackling/electrical", "component detachment", "breakage/durability", "sound quality"
    sentiment = Column(String, default="negative", index=True)
    keyword = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

