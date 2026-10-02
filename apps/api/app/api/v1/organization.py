import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models import Product, ProductHold, SafetySignal, Review
from app.services.hold_service import HoldService

logger = logging.getLogger(__name__)

router = APIRouter()

# -------------------------------------------------------------
# 1. Partner Organization Mock Receiver Endpoints
# -------------------------------------------------------------

@router.post("/mock/hold")
def mock_org_hold_receiver(payload: Dict[str, Any] = Body(...)):
    """
    Simulates the organization-side retail ERP / catalog management webhook receiver.
    A real HTTP POST hits this endpoint and triggers immediate catalog hold.
    """
    product_id = payload.get("product_id", "UNKNOWN")
    product_name = payload.get("product_name", "Unknown Item")
    hazard_score = payload.get("hazard_score", 0.0)
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"

    return {
        "status": "HOLD_ACKNOWLEDGED",
        "partner": "RetailOps Distribution & Fulfillment Gateway",
        "ticket_id": ticket_id,
        "product_id": product_id,
        "product_name": product_name,
        "hazard_score": hazard_score,
        "action_taken": "SALES_CHANNEL_DISABLED_AND_INVENTORY_QUARANTINED",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.post("/mock/resume")
def mock_org_resume_receiver(payload: Dict[str, Any] = Body(...)):
    """
    Simulates the organization-side retail ERP / catalog management resume receiver.
    """
    product_id = payload.get("product_id", "UNKNOWN")
    product_name = payload.get("product_name", "Unknown Item")
    ticket_id = f"CLR-{uuid.uuid4().hex[:8].upper()}"

    return {
        "status": "RESUME_ACKNOWLEDGED",
        "partner": "RetailOps Distribution & Fulfillment Gateway",
        "clearance_ticket_id": ticket_id,
        "product_id": product_id,
        "product_name": product_name,
        "action_taken": "SALES_CHANNEL_RESTORED_AND_INVENTORY_UNLOCKED",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# -------------------------------------------------------------
# 2. Organization Safety & Hold Management Endpoints
# -------------------------------------------------------------

@router.get("/holds")
def get_organization_holds(
    status: Optional[str] = Query(None, description="Filter by 'ON_HOLD', 'RESOLVED', or omit for all"),
    db: Session = Depends(get_db)
):
    """
    Returns products on hold for the Organization tab.
    Includes hold duration, hazard score, evidence citations, and resolution audit history.
    """
    query = db.query(ProductHold)
    if status and status.upper() != "ALL":
        query = query.filter(ProductHold.status == status.upper())

    holds = query.order_by(ProductHold.hold_started_at.desc()).all()

    items = []
    active_count = 0
    resolved_count = 0

    now = datetime.utcnow()

    for h in holds:
        if h.status == "ON_HOLD":
            active_count += 1
        elif h.status == "RESOLVED":
            resolved_count += 1

        product = db.query(Product).filter(Product.id == h.product_id).first()
        prod_name = product.name if product else "Unknown Product"
        prod_brand = product.brand if product else "Generic"
        prod_category = product.category if product else "General"
        asin = product.external_id if product else h.product_id

        # Calculate hold duration
        end_time = h.resolved_at if h.status == "RESOLVED" and h.resolved_at else now
        duration_hours = max(round((end_time - h.hold_started_at).total_seconds() / 3600.0, 1), 0.1)

        items.append({
            "id": h.id,
            "product_id": h.product_id,
            "product_name": prod_name,
            "asin": asin,
            "brand": prod_brand,
            "category": prod_category,
            "status": h.status,
            "hazard_score": h.hazard_score,
            "threshold": h.threshold,
            "reason": h.reason,
            "evidence_citations": h.evidence_citations or [],
            "hold_started_at": h.hold_started_at.strftime("%Y-%m-%d %H:%M:%S") if h.hold_started_at else None,
            "resolved_at": h.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if h.resolved_at else None,
            "resolved_by": h.resolved_by,
            "resolve_reason": h.resolve_reason,
            "recheck_score": h.recheck_score,
            "duration_hours": duration_hours,
            "org_notified": h.org_hold_notified,
            "org_hold_response": h.org_hold_response,
            "org_resume_response": h.org_resume_response
        })

    return {
        "items": items,
        "total": len(items),
        "active_on_hold": active_count,
        "resolved_holds": resolved_count
    }


@router.get("/holds/{product_id}")
def get_product_hold_detail(product_id: str, db: Session = Depends(get_db)):
    """
    Returns hold status and recheck metrics for a specific product.
    """
    hold = (
        db.query(ProductHold)
        .filter(ProductHold.product_id == product_id)
        .order_by(ProductHold.created_at.desc())
        .first()
    )

    service = HoldService(db)
    recheck = service.recheck_product_hazard(product_id)

    return {
        "product_id": product_id,
        "has_hold_record": hold is not None,
        "hold": {
            "id": hold.id,
            "status": hold.status,
            "hazard_score": hold.hazard_score,
            "reason": hold.reason,
            "hold_started_at": hold.hold_started_at.strftime("%Y-%m-%d %H:%M:%S") if hold and hold.hold_started_at else None,
            "resolved_at": hold.resolved_at.strftime("%Y-%m-%d %H:%M:%S") if hold and hold.resolved_at else None,
            "resolved_by": hold.resolved_by if hold else None,
            "resolve_reason": hold.resolve_reason if hold else None,
            "evidence_citations": hold.evidence_citations or [] if hold else []
        } if hold else None,
        "live_recheck": recheck
    }


@router.post("/holds/{product_id}/recheck")
def recheck_product(product_id: str, db: Session = Depends(get_db)):
    """
    Recomputes the hazard score from scratch against live database reviews and safety signals.
    """
    service = HoldService(db)
    return service.recheck_product_hazard(product_id)


@router.post("/holds/{product_id}/resume")
def resume_product_selling(
    product_id: str,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db)
):
    """
    Manual 'Resume Selling' action by the organization.
    Re-checks hazard score against current data before proceeding.
    """
    force_resume = bool(payload.get("force_resume", False))
    resolved_by = payload.get("resolved_by", "Organization Safety Officer")
    notes = payload.get("notes")

    service = HoldService(db)
    result = service.resume_product(
        product_id=product_id,
        force_resume=force_resume,
        resolved_by=resolved_by,
        notes=notes
    )

    if not result.get("success") and result.get("requires_confirmation"):
        # Return 200 with confirmation challenge so frontend can prompt the user
        return result

    return result


@router.post("/sync-active-hazards")
def sync_active_hazards(db: Session = Depends(get_db)):
    """
    Scans products in the database with hazard score >= 70.0 and initializes holds if not yet present.
    Ensures existing high-risk items are reflected in the Organization tab.
    """
    from app.api.v1.overview import get_shared_product_risk_list
    ranked = get_shared_product_risk_list(db)
    high_risk = [p for p in ranked if p.get("composite_score", 0) >= 70.0]

    service = HoldService(db)
    held_items = []

    for p in high_risk:
        hold = service.trigger_auto_hold(
            product_id=p["id"],
            risk_score=p["composite_score"],
            threshold=70.0,
            reason=p.get("why_flagged")
        )
        if hold:
            held_items.append({
                "product_id": p["id"],
                "product_name": p["name"],
                "hazard_score": hold.hazard_score,
                "status": hold.status
            })

    return {
        "status": "success",
        "scanned_high_risk_count": len(high_risk),
        "held_count": len(held_items),
        "held_items": held_items
    }
