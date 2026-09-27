from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.db.session import get_db, engine
from app.models import Review, Product, SafetySignal, Recall

router = APIRouter()

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    is_live = False
    dialect_name = "unknown"
    try:
        db.execute(text("SELECT 1"))
        is_live = True
        dialect_name = db.bind.dialect.name if db.bind else engine.dialect.name
    except Exception:
        is_live = False

    engine_label = "PostgreSQL" if dialect_name == "postgresql" else ("SQLite" if dialect_name == "sqlite" else dialect_name.upper())

    total_reviews = db.query(Review).count() if is_live else 0
    total_products = db.query(Product).count() if is_live else 0
    total_signals = db.query(SafetySignal).count() if is_live else 0
    
    last_review = db.query(Review).order_by(Review.review_date.desc()).first() if is_live else None
    last_ingest = last_review.review_date.strftime("%Y-%m-%d %H:%M:%S") if last_review else "2024-03-07 00:00:00"

    return {
        "dataset_name": "Musical_instruments_reviews.csv",
        "total_reviews": total_reviews,
        "total_products": total_products,
        "total_signals": total_signals,
        "last_ingestion_time": last_ingest,
        "last_ingest_time": last_ingest,
        "db_engine": engine_label,
        "database_engine": engine_label,
        "dialect": dialect_name,
        "is_connected": is_live,
        "status": "Healthy" if is_live else "Degraded",
        "surveillance_mode": "Active Surveillance",
        "classifier_type": "Lexicon Safety Engine"
    }
