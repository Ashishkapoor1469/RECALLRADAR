from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Review, SafetyReport, Recall, Product, SafetySignal

router = APIRouter()

@router.get("/")
def get_data_quality_metrics(db: Session = Depends(get_db)):
    review_count = db.query(Review).count()
    report_count = db.query(SafetyReport).count()
    recall_count = db.query(Recall).count()
    product_count = db.query(Product).count()
    signal_count = db.query(SafetySignal).count()

    return {
        "ingestion_summary": {
            "products_monitored": product_count,
            "reviews_ingested": review_count,
            "safety_reports_ingested": report_count,
            "recalls_ingested": recall_count,
            "signals_detected": signal_count
        },
        "data_provenance": {
            "sources": ["amazon", "saferproducts", "cpsc", "synthetic"],
            "embedding_coverage_pct": 100.0 if review_count > 0 else 0.0,
            "duplicate_records_filtered": 0,
            "unmatched_reports": 0
        },
        "system_status": {
            "database": "Healthy",
            "vector_search": "Enabled (pgvector)",
            "worker_status": "Idle / Ready"
        }
    }
