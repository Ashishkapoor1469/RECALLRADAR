from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.models import Review, Product, SafetySignal, Recall

router = APIRouter()

@router.get("/status")
def get_system_status(db: Session = Depends(get_db)):
    total_reviews = db.query(Review).count()
    total_products = db.query(Product).count()
    total_signals = db.query(SafetySignal).count()
    
    last_review = db.query(Review).order_by(Review.review_date.desc()).first()
    last_ingest = last_review.review_date.strftime("%Y-%m-%d %H:%M:%S") if last_review else "2024-03-07 00:00:00"

    return {
        "dataset_name": "Musical_instruments_reviews.csv",
        "total_reviews": total_reviews,
        "total_products": total_products,
        "total_signals": total_signals,
        "last_ingestion_time": last_ingest,
        "db_engine": "PostgreSQL / SQLite Engine",
        "status": "Healthy",
        "surveillance_mode": "Active Surveillance"
    }
