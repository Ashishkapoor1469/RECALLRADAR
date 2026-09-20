from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ProductSchema(BaseModel):
    id: str
    external_id: Optional[str] = None
    name: str
    brand: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RiskQueueItemSchema(BaseModel):
    id: str
    name: str
    brand: Optional[str] = None
    category: str
    risk_score: float
    trend: str
    confidence: str
    signal_count: int
    latest_signal: Optional[str] = None
    recall_status: str
    lead_time_weeks: Optional[float] = None

class RiskTimelinePointSchema(BaseModel):
    date: str
    risk_score: float
    signal_count: int
    alert_triggered: bool

class AskRequestSchema(BaseModel):
    query: Optional[str] = None
    question: Optional[str] = None
    product_id: Optional[str] = None

class AskResponseSchema(BaseModel):
    answer: str
    citations: List[str]

class RuleCreateSchema(BaseModel):
    text: str

class BacktestRequestSchema(BaseModel):
    name: str = "Backtest Run"
    alert_budget: int = 25
    threshold: float = 70.0
    categories: Optional[List[str]] = None
