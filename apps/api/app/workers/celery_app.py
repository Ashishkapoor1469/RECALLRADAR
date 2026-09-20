from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "recallradar_workers",
    broker=settings.sync_redis_url,
    backend=settings.sync_redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

@celery_app.task(name="ingest_cpsc")
def ingest_cpsc_task():
    print("Executing background task: ingest_cpsc")
    return {"status": "success", "records": 0}

@celery_app.task(name="calculate_risk")
def calculate_risk_task(product_id: str):
    print(f"Executing background task: calculate_risk for {product_id}")
    return {"status": "success", "product_id": product_id}
