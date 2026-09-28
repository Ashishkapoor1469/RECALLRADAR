from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models import Review, SafetyReport, Recall, Product, SafetySignal
from app.core.config import settings

router = APIRouter()

@router.get("/")
def get_data_quality_metrics(db: Session = Depends(get_db)):
    review_count = db.query(Review).count()
    report_count = db.query(SafetyReport).count()
    recall_count = db.query(Recall).count()
    product_count = db.query(Product).count()
    signal_count = db.query(SafetySignal).count()

    # 1. Real Database Probe (SELECT 1)
    db_status = "Unavailable"
    try:
        res = db.execute(text("SELECT 1")).scalar()
        if res == 1:
            db_status = "Healthy"
        else:
            db_status = "Degraded"
    except Exception:
        db_status = "Unavailable"

    # 2. Real Vector Coverage Check (Real math, not a label)
    reviews_with_embedding = 0
    try:
        reviews_with_embedding = db.query(Review).filter(Review.embedding.isnot(None)).count()
    except Exception:
        pass
    
    embedding_coverage_pct = round((reviews_with_embedding / review_count * 100.0), 1) if review_count > 0 else 0.0

    if embedding_coverage_pct >= 90.0:
        vector_status = "Healthy (pgvector)"
    elif embedding_coverage_pct > 0.0:
        vector_status = f"Degraded ({embedding_coverage_pct}% vector coverage)"
    else:
        vector_status = "Degraded (0% vector coverage)"

    # 3. Real Celery/Redis ping with short timeout
    worker_status = "Unavailable"
    try:
        if settings.REDIS_URL:
            import redis
            r = redis.from_url(settings.REDIS_URL, socket_timeout=1.5)
            if r.ping():
                # Check for active celery workers
                try:
                    from app.workers.celery_app import celery_app
                    i = celery_app.control.inspect(timeout=1.0)
                    ping_res = i.ping()
                    if ping_res:
                        worker_status = "Healthy (Celery Active)"
                    else:
                        worker_status = "Degraded (Broker Ready / No Celery Workers)"
                except Exception:
                    worker_status = "Degraded (Broker Ready / Celery Offline)"
            else:
                worker_status = "Unavailable"
        else:
            worker_status = "Unavailable (No Broker Configured)"
    except Exception:
        worker_status = "Unavailable"

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
            "embedding_coverage_pct": embedding_coverage_pct,
            "duplicate_records_filtered": 0,
            "unmatched_reports": 0
        },
        "system_status": {
            "database": db_status,
            "vector_search": vector_status,
            "worker_status": worker_status
        },
        "probes": {
            "db_ping": db_status == "Healthy",
            "reviews_with_embedding": reviews_with_embedding,
            "total_reviews": review_count,
            "worker_status_detail": worker_status
        }
    }

