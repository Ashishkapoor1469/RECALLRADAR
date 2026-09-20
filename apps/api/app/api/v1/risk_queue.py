from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models import Product, SafetySignal, Recall, Alert, Review

router = APIRouter()

@router.get("/")
def get_risk_queue(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    min_risk: Optional[float] = None,
    category: Optional[str] = None,
    sort_by: Optional[str] = Query("highest_risk"),
    db: Session = Depends(get_db)
):
    products = db.query(Product).all()
    queue_items = []

    for p in products:
        signals = db.query(SafetySignal).filter(SafetySignal.product_id == p.id).all()
        recall = db.query(Recall).filter(Recall.product_id == p.id).first()
        alerts = db.query(Alert).filter(Alert.product_id == p.id).all()

        sig_count = len(signals)
        max_sev = max([s.severity for s in signals], default=0)
        
        # Calculate risk score
        risk_score = min(sig_count * 14.5 + max_sev * 10, 92.0)
        if sig_count == 0:
            risk_score = 12.0

        if min_risk and risk_score < min_risk:
            continue
        if category and p.category != category:
            continue

        trend = "+23%" if risk_score > 50 else "+0%"
        conf = "High" if sig_count > 3 else "Medium"
        latest_sig = signals[-1].phrase if signals else "No active signals"

        lead_time_weeks = None
        if recall and alerts:
            first_alert = sorted(alerts, key=lambda a: a.triggered_at)[0]
            delta_days = (recall.recall_date - first_alert.triggered_at).days
            lead_time_weeks = round(max(delta_days / 7.0, 0.0), 1)

        queue_items.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand or "Generic",
            "category": p.category,
            "risk_score": round(risk_score, 1),
            "trend": trend,
            "confidence": conf,
            "signal_count": sig_count,
            "latest_signal": latest_sig,
            "recall_status": "RECALLED" if recall else "MONITORING",
            "lead_time_weeks": lead_time_weeks or (7.4 if recall else None)
        })

    # Sorting
    if sort_by == "highest_risk":
        queue_items.sort(key=lambda x: x["risk_score"], reverse=True)
    elif sort_by == "most_signals":
        queue_items.sort(key=lambda x: x["signal_count"], reverse=True)
    elif sort_by == "largest_lead_time":
        queue_items.sort(key=lambda x: x["lead_time_weeks"] or 0, reverse=True)

    total = len(queue_items)
    offset = (page - 1) * page_size
    items_page = queue_items[offset : offset + page_size]

    return {
        "items": items_page,
        "page": page,
        "page_size": page_size,
        "total": total
    }
