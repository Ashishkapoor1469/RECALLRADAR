import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from app.db.session import get_db
from app.models import Product, Review, SafetySignal, ReviewSignal, ProductRiskSnapshot
from app.schemas.schemas import ReviewCreateSchema
from app.ml.detection.detector import SafetySignalDetector

router = APIRouter()

@router.post("/submit")
@router.post("/")
def submit_review(payload: ReviewCreateSchema, db: Session = Depends(get_db)):
    """
    Submits a new customer review directly to the database.
    - Determines positive vs negative sentiment based on rating & text.
    - Detects safety signals and defect keywords in real-time.
    - Persists directly into PostgreSQL / SQLite database.
    - Recalculates product risk telemetry instantly.
    """
    if not payload.body or not payload.body.strip():
        raise HTTPException(status_code=400, detail="Review body text is required")
    
    if payload.rating < 1.0 or payload.rating > 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0")

    # 1. Resolve or Create Product in DB
    product = None
    if payload.product_id:
        product = db.query(Product).filter(
            or_(Product.id == payload.product_id, Product.external_id == payload.product_id)
        ).first()

    if not product and payload.product_name:
        # Search by exact or close name
        product = db.query(Product).filter(Product.name.ilike(f"%{payload.product_name.strip()}%")).first()

    if not product:
        prod_name = payload.product_name.strip() if payload.product_name else "Generic Monitored Product"
        brand_name = payload.brand.strip() if payload.brand else "Verified Brand"
        category_name = payload.category.strip() if payload.category else "Musical Instruments"
        ext_id = f"EXT-{str(uuid.uuid4())[:8].upper()}"
        
        product = Product(
            id=str(uuid.uuid4()),
            external_id=ext_id,
            name=prod_name,
            brand=brand_name,
            category=category_name,
            description=f"Indexed catalog item: {prod_name}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(product)
        db.flush()

    # 2. Create and Persist Review Record
    review_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    review = Review(
        id=review_id,
        product_id=product.id,
        external_id=f"REV-{str(uuid.uuid4())[:8].upper()}",
        rating=float(payload.rating),
        title=payload.title.strip() if payload.title else ("Positive Review" if payload.rating >= 4.0 else "Negative Feedback"),
        body=payload.body.strip(),
        review_date=now,
        verified=True,
        source=payload.source or "Customer Review Portal",
        created_at=now
    )
    db.add(review)

    # 3. Perform AI / Rules Safety Signal Detection
    full_text = f"{payload.title or ''}. {payload.body or ''}"
    detector = SafetySignalDetector()
    detections = detector.detect(full_text, rating=payload.rating)

    created_signals = []
    for det in detections:
        sig_id = str(uuid.uuid4())
        safety_sig = SafetySignal(
            id=sig_id,
            product_id=product.id,
            review_id=review_id,
            signal_type=det["signal_type"],
            phrase=det["phrase"],
            severity=det["severity"],
            confidence=det["confidence"],
            detected_at=now
        )
        db.add(safety_sig)

        rev_sig = ReviewSignal(
            id=str(uuid.uuid4()),
            review_id=review_id,
            product_id=product.id,
            category=det["signal_type"],
            sentiment="negative" if payload.rating <= 3.0 else "positive",
            keyword=det["phrase"],
            created_at=now
        )
        db.add(rev_sig)
        created_signals.append({
            "id": sig_id,
            "signal_type": det["signal_type"],
            "phrase": det["phrase"],
            "severity": det["severity"]
        })

    # 4. Update Product Telemetry & Timestamp
    product.updated_at = now
    
    # Recalculate composite risk for product
    all_p_signals = db.query(SafetySignal).filter(SafetySignal.product_id == product.id).all()
    sig_count = len(all_p_signals) + len(created_signals)
    max_sev = max([s.severity for s in all_p_signals] + [d["severity"] for d in created_signals], default=0)
    neg_count = db.query(Review).filter(Review.product_id == product.id, Review.rating <= 3.0).count()
    if payload.rating <= 3.0:
        neg_count += 1
        
    if sig_count > 0:
        new_risk = min(sig_count * 14.5 + max_sev * 10.0, 92.0)
    elif neg_count > 0:
        new_risk = min(neg_count * 3.5, 45.0)
    else:
        new_risk = 12.0

    # Save risk snapshot
    snapshot = ProductRiskSnapshot(
        id=str(uuid.uuid4()),
        product_id=product.id,
        snapshot_date=now,
        risk_score=round(new_risk, 1),
        signal_count=sig_count,
        created_at=now
    )
    db.add(snapshot)

    # 5. Commit directly to DB
    db.commit()
    db.refresh(review)
    db.refresh(product)

    sentiment_label = "Positive" if payload.rating >= 4.0 else ("Negative / Defect Signal" if payload.rating <= 3.0 else "Neutral")

    return {
        "success": True,
        "message": "Review submitted directly to database and processed in real-time!",
        "realtime_status": "Persisted in Live DB",
        "review": {
            "id": review.id,
            "external_id": review.external_id,
            "product_id": review.product_id,
            "rating": review.rating,
            "title": review.title,
            "body": review.body,
            "source": review.source,
            "created_at": review.created_at.isoformat(),
            "sentiment": sentiment_label
        },
        "product": {
            "id": product.id,
            "external_id": product.external_id,
            "name": product.name,
            "brand": product.brand,
            "category": product.category,
            "updated_risk_score": round(new_risk, 1)
        },
        "detected_signals": created_signals,
        "signals_count": len(created_signals)
    }


@router.get("/recent")
def get_recent_reviews(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns recent reviews directly from the database for real-time live feed updates.
    """
    reviews = db.query(Review).order_by(desc(Review.created_at)).limit(limit).all()
    results = []
    
    for r in reviews:
        prod = db.query(Product).filter(Product.id == r.product_id).first()
        signals = db.query(SafetySignal).filter(SafetySignal.review_id == r.id).all()
        
        sentiment = "Positive" if r.rating >= 4.0 else ("Negative / Defect Signal" if r.rating <= 3.0 else "Neutral")
        
        results.append({
            "id": r.id,
            "external_id": r.external_id,
            "product_id": r.product_id,
            "product_name": prod.name if prod else "Unknown Product",
            "product_brand": prod.brand if prod else "N/A",
            "product_category": prod.category if prod else "General",
            "rating": r.rating,
            "title": r.title,
            "body": r.body,
            "sentiment": sentiment,
            "source": r.source or "Customer Portal",
            "review_date": r.review_date.strftime("%Y-%m-%d %H:%M:%S") if r.review_date else r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "signals": [
                {
                    "signal_type": s.signal_type,
                    "phrase": s.phrase,
                    "severity": s.severity
                }
                for s in signals
            ]
        })

    return {
        "items": results,
        "total": len(results),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/stats")
def get_review_stats(db: Session = Depends(get_db)):
    """
    Provides real-time DB counts for positive reviews, negative reviews, total reviews, and defect signals.
    """
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    positive_reviews = db.query(func.count(Review.id)).filter(Review.rating >= 4.0).scalar() or 0
    negative_reviews = db.query(func.count(Review.id)).filter(Review.rating <= 3.0).scalar() or 0
    total_signals = db.query(func.count(SafetySignal.id)).scalar() or 0
    
    latest_rev = db.query(Review).order_by(desc(Review.created_at)).first()

    return {
        "total_reviews": total_reviews,
        "positive_reviews": positive_reviews,
        "negative_reviews": negative_reviews,
        "total_safety_signals": total_signals,
        "latest_review_time": latest_rev.created_at.isoformat() if (latest_rev and latest_rev.created_at) else None,
        "db_status": "Active & Connected"
    }
