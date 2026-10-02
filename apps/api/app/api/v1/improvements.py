from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.services.improvement_service import ImprovementService

router = APIRouter()

@router.get("/")
def get_improvement_products(
    sort_by: str = Query("index", pattern="^(index|count)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns all products with detected improvement suggestions,
    sorted by Improvement Index (default) or review count.
    """
    service = ImprovementService(db)
    return service.get_improvement_products(
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )

@router.get("/stats")
def get_improvement_summary_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate statistics for product improvement suggestions.
    """
    service = ImprovementService(db)
    return service.get_summary_stats()

@router.get("/{product_id}")
def get_product_improvement_details(
    product_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns detailed cluster and evidence citations for a specific product.
    """
    service = ImprovementService(db)
    data = service.get_product_detail(product_id)
    if not data:
        raise HTTPException(status_code=404, detail="Product not found or has no improvement reviews")
    return data

@router.post("/sync")
def trigger_improvement_sync(db: Session = Depends(get_db)):
    """
    Triggers re-scanning of reviews and updating cluster metrics.
    """
    service = ImprovementService(db)
    res = service.sync_improvement_signals()
    return {"status": "success", "synced": res}
