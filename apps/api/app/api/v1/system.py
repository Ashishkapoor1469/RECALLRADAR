from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from datetime import datetime
import hashlib
import time
from typing import Dict, Any, Optional

from app.db.session import get_db, engine
from app.models import Review, Product, SafetySignal, Recall, Alert, ProductRiskSnapshot

router = APIRouter()

# Short-lived in-memory cache (1.5s) to guarantee fast sub-50ms responses during frequent polling
_changes_cache: Dict[str, Any] = {
    "timestamp": 0.0,
    "payload": None
}

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

    total_reviews = 0
    total_products = 0
    total_signals = 0
    last_ingest = "2024-03-07 00:00:00"

    if is_live:
        try:
            total_reviews = db.query(Review).count()
            total_products = db.query(Product).count()
            total_signals = db.query(SafetySignal).count()
            last_review = db.query(Review).order_by(Review.review_date.desc()).first()
            if last_review and hasattr(last_review, 'review_date') and last_review.review_date:
                last_ingest = last_review.review_date.strftime("%Y-%m-%d %H:%M:%S")
        except Exception as qe:
            print(f"Error querying table stats: {qe}")

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


def get_optional_db():
    return None

@router.get("/changes")
def get_system_changes(db_override: Optional[Session] = Depends(get_optional_db)):
    """
    Lightweight, sub-50ms change token endpoint for real-time frontend synchronization.
    Returns composite hashes and timestamps for reviews, products, alerts, and signals.
    Cached for up to 1.5 seconds in memory. Returns HTTP 503 if database is unreachable.
    """
    global _changes_cache
    # In-memory cache valid for 2.0 seconds
    if _changes_cache["payload"] is not None and (time.time() - _changes_cache["timestamp"]) < 2.0:
        return _changes_cache["payload"]

    from app.db.session import SessionLocal
    db = db_override if db_override is not None else SessionLocal()
    should_close = db_override is None

    try:
        db.execute(text("SELECT 1"))
        rev_count, rev_max = db.query(func.count(Review.id), func.max(Review.created_at)).first()
        prod_count, prod_max = db.query(func.count(Product.id), func.max(Product.updated_at)).first()
        alert_count, alert_max = db.query(func.count(Alert.id), func.max(Alert.created_at)).first()
        sig_count, sig_max = db.query(func.count(SafetySignal.id), func.max(SafetySignal.detected_at)).first()
        snap_count, snap_max = db.query(func.count(ProductRiskSnapshot.id), func.max(ProductRiskSnapshot.created_at)).first()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {str(e)}"
        )
    finally:
        if should_close:
            db.close()

    rev_token = f"{rev_count or 0}:{rev_max.isoformat() if rev_max else '0'}"
    prod_token = f"{prod_count or 0}:{prod_max.isoformat() if prod_max else '0'}:{snap_count or 0}:{snap_max.isoformat() if snap_max else '0'}"
    alert_token = f"{alert_count or 0}:{alert_max.isoformat() if alert_max else '0'}"
    sig_token = f"{sig_count or 0}:{sig_max.isoformat() if sig_max else '0'}"

    raw_combined = f"{rev_token}|{prod_token}|{alert_token}|{sig_token}"
    version = hashlib.md5(raw_combined.encode("utf-8")).hexdigest()[:16]

    payload = {
        "reviews": rev_token,
        "products": prod_token,
        "alerts": alert_token,
        "signals": sig_token,
        "version": version
    }

    _changes_cache["timestamp"] = time.time()
    _changes_cache["payload"] = payload
    return payload

