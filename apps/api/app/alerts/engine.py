from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Alert, AlertEvidence, ProductRiskSnapshot, Review, SafetyReport

class AlertEngine:
    """Evaluates risk snapshots and rule thresholds to generate alerts and evidence links."""

    def __init__(self, db: Session):
        self.db = db

    def evaluate_product_risk(
        self,
        risk_result: Dict[str, Any],
        threshold: float = 70.0,
        as_of_date: Optional[datetime] = None
    ) -> Optional[Alert]:
        """Triggers an Alert if risk_score exceeds threshold."""
        prod_id = risk_result["product_id"]
        risk_score = risk_result["risk_score"]
        conf_label = risk_result.get("confidence_label", "Medium")
        conf_score = risk_result.get("confidence_score", 0.7)
        triggered_at = as_of_date or datetime.utcnow()

        if risk_score < threshold:
            return None

        # Check if an active alert already exists for this product around this timestamp
        existing = self.db.query(Alert).filter(
            Alert.product_id == prod_id,
            Alert.status == "ACTIVE"
        ).first()

        if existing:
            # Update existing alert score
            existing.risk_score = risk_score
            existing.confidence = conf_label
            existing.confidence_score = conf_score
            self.db.commit()
            return existing

        # Create new alert
        alert = Alert(
            product_id=prod_id,
            alert_type="THRESHOLD_EXCEEDED",
            threshold=threshold,
            risk_score=risk_score,
            confidence=conf_label,
            confidence_score=conf_score,
            triggered_at=triggered_at,
            status="ACTIVE",
            model_version="alert-v1.0",
            explanation={"contributors": risk_result.get("contributors", [])}
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)

        # Attach flagged reviews as evidence items
        flagged_reviews = self.db.query(Review).filter(
            Review.product_id == prod_id,
            Review.review_date <= triggered_at
        ).all()

        for rev in flagged_reviews[:5]:
            ev = AlertEvidence(
                alert_id=alert.id,
                review_id=rev.id,
                evidence_text=f"[{rev.rating}★] {rev.title}: {rev.body}",
                danger_phrase=rev.title,
                relevance_score=0.9
            )
            self.db.add(ev)
        self.db.commit()

        return alert
