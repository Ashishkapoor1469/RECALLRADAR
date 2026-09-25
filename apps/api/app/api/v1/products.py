from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models import Product, Review, SafetySignal, Alert, Recall, ProductRiskSnapshot
from app.schemas.schemas import ProductSchema, RiskTimelinePointSchema

router = APIRouter()

@router.get("/", response_model=List[ProductSchema])
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size).all()

@router.get("/attention")
def get_products_needing_attention(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Ranks top products by transparent attention score using shared single source of truth."""
    from app.api.v1.overview import get_shared_product_risk_list
    ranked_items = get_shared_product_risk_list(db)
    top_items = ranked_items[:limit]
    return {
        "items": top_items,
        "total": len(top_items),
        "limit": limit
    }

@router.get("/{product_id}")
def get_product_detail(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    recall = db.query(Recall).filter(Recall.product_id == product_id).first()
    alerts = db.query(Alert).filter(Alert.product_id == product_id).all()
    signals = db.query(SafetySignal).filter(SafetySignal.product_id == product_id).all()
    review_signals = db.query(ReviewSignal).filter(ReviewSignal.product_id == product_id).all()
    
    # Calculate current risk consistently with Risk Queue
    snapshots = db.query(ProductRiskSnapshot).filter(ProductRiskSnapshot.product_id == product_id).order_by(ProductRiskSnapshot.snapshot_date.desc()).all()
    if snapshots:
        current_risk = snapshots[0].risk_score
    else:
        sig_count = len(signals)
        max_sev = max([s.severity for s in signals], default=0)
        current_risk = min(sig_count * 14.5 + max_sev * 10, 92.0) if sig_count > 0 else 12.0

    # Extract phrases and signal cluster label
    signal_phrases = list(dict.fromkeys([s.phrase for s in signals if s.phrase]))
    signal_types = list(dict.fromkeys([s.signal_type for s in signals if s.signal_type]))
    
    if signal_phrases:
        signal_cluster = ", ".join(signal_phrases[:3])
    elif signal_types:
        signal_cluster = ", ".join(signal_types[:3])
    elif review_signals:
        rev_cats = list(dict.fromkeys([rs.category for rs in review_signals if rs.category]))
        signal_cluster = ", ".join(rev_cats[:3])
    else:
        signal_cluster = "No active defect signals"

    # Query evidence reviews directly tied to signals/defects
    signal_review_ids = set([s.review_id for s in signals if s.review_id] + [rs.review_id for rs in review_signals if rs.review_id])
    
    evidence_reviews = []
    if signal_review_ids:
        evidence_reviews = db.query(Review).filter(Review.id.in_(list(signal_review_ids))).order_by(Review.review_date.desc()).limit(5).all()

    retrieved_ids = set([r.id for r in evidence_reviews])
    if len(evidence_reviews) < 5 and signal_phrases:
        for phrase in signal_phrases:
            matching = db.query(Review).filter(Review.product_id == product_id, Review.body.ilike(f"%{phrase}%")).order_by(Review.review_date.desc()).limit(5).all()
            for m in matching:
                if m.id not in retrieved_ids and len(evidence_reviews) < 5:
                    evidence_reviews.append(m)
                    retrieved_ids.add(m.id)

    if len(evidence_reviews) < 5:
        neg_reviews = db.query(Review).filter(Review.product_id == product_id, Review.rating <= 3.0).order_by(Review.review_date.desc()).limit(5).all()
        for nr in neg_reviews:
            if nr.id not in retrieved_ids and len(evidence_reviews) < 5:
                evidence_reviews.append(nr)
                retrieved_ids.add(nr.id)

    if len(evidence_reviews) < 5:
        recent = db.query(Review).filter(Review.product_id == product_id).order_by(Review.review_date.desc()).limit(5).all()
        for rc in recent:
            if rc.id not in retrieved_ids and len(evidence_reviews) < 5:
                evidence_reviews.append(rc)
                retrieved_ids.add(rc.id)

    formatted_reviews = []
    for r in evidence_reviews:
        matched_phrase = None
        for s in signals:
            if s.review_id == r.id or (s.phrase and s.phrase.lower() in r.body.lower()):
                matched_phrase = s.phrase or s.signal_type
                break
        if not matched_phrase:
            for rs in review_signals:
                if rs.review_id == r.id:
                    matched_phrase = rs.keyword or rs.category
                    break

        formatted_reviews.append({
            "id": r.external_id or r.id,
            "date": r.review_date.strftime("%Y-%m-%d"),
            "rating": r.rating,
            "text": r.body,
            "verified": r.verified,
            "matched_signal": matched_phrase
        })

    # Lead time calculation
    lead_time_weeks = None
    if recall and alerts:
        first_alert = sorted(alerts, key=lambda a: a.triggered_at)[0]
        delta_days = (recall.recall_date - first_alert.triggered_at).days
        lead_time_weeks = round(max(delta_days / 7.0, 0.0), 1)

    return {
        "product": ProductSchema.from_orm(product),
        "current_risk": current_risk,
        "confidence": "High" if current_risk > 70 else "Medium",
        "signal_cluster": signal_cluster,
        "signal_phrases": signal_phrases,
        "recall": {
            "is_recalled": recall is not None,
            "recall_date": recall.recall_date.strftime("%Y-%m-%d") if recall else None,
            "hazard": recall.hazard if recall else None
        } if recall else None,
        "lead_time_weeks": lead_time_weeks,
        "alert_count": len(alerts),
        "signal_count": len(signals),
        "reviews": formatted_reviews
    }

@router.get("/{product_id}/timeline")
def get_product_timeline(product_id: str, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.review_date.asc()).all()
    signals = db.query(SafetySignal).filter(SafetySignal.product_id == product_id).all()
    recall = db.query(Recall).filter(Recall.product_id == product_id).first()
    alerts = db.query(Alert).filter(Alert.product_id == product_id).all()

    timeline_points = []
    start_date = datetime(2024, 1, 1)

    for week in range(1, 13):
        w_date = start_date + timedelta(weeks=week)
        w_signals = [s for s in signals if s.detected_at and s.detected_at <= w_date]
        w_alerts = [a for a in alerts if a.triggered_at and a.triggered_at <= w_date]
        
        # Calculate risk curve simulation matching review count & severities
        w_risk = min(len(w_signals) * 14.5 + (max([s.severity for s in w_signals], default=0) * 10), 92.0)
        if len(w_signals) == 0:
            w_risk = 12.0

        timeline_points.append({
            "week": week,
            "date": w_date.strftime("%Y-%m-%d"),
            "risk_score": round(w_risk, 1),
            "signal_count": len(w_signals),
            "alert_fired": len(w_alerts) > 0,
            "recalled": recall is not None and w_date >= recall.recall_date
        })

    return {
        "product_id": product_id,
        "timeline": timeline_points
    }
