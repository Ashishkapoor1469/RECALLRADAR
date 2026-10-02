import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Alert, AlertEvidence, ProductRiskSnapshot, Review, SafetyReport, SafetySignal, Product

class AlertEngine:
    """Evaluates risk snapshots, spike trends, and rule thresholds to generate alerts and evidence links."""

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

        # Auto-hold trigger for critical hazard threshold
        try:
            from app.services.hold_service import HoldService
            hold_service = HoldService(self.db)
            hold_service.trigger_auto_hold(
                product_id=prod_id,
                risk_score=risk_score,
                threshold=threshold,
                reason=f"Hazard score {risk_score:.1f} crossed threshold ({threshold:.1f})"
            )
        except Exception as e:
            print(f"Auto-hold evaluation warning in evaluate_product_risk: {e}")

        return alert

    def evaluate_defect_spike(
        self,
        product_id: str,
        hazard_keyword: Optional[str] = None,
        window_days: int = 14,
        threshold_multiplier: float = 2.0,
        min_mentions: int = 3,
        as_of_date: Optional[datetime] = None,
        dispatch: bool = False,
        recipient: Optional[str] = None
    ) -> Optional[Alert]:
        """
        Compares defect-signal counts for a product or hazard cluster in the last N days
        against the prior N days, and fires when the ratio passes threshold_multiplier.
        Requires current_count >= min_mentions so low-volume noise (e.g. 1 -> 2) does not trigger it.
        """
        now = as_of_date or datetime.utcnow()
        current_start = now - timedelta(days=window_days)
        prior_start = current_start - timedelta(days=window_days)

        # Base query for signals
        query = self.db.query(SafetySignal).filter(
            SafetySignal.product_id == product_id
        )
        if hazard_keyword:
            kw = hazard_keyword.lower()
            query = query.filter(
                (SafetySignal.phrase.ilike(f"%{kw}%")) | (SafetySignal.signal_type.ilike(f"%{kw}%"))
            )

        current_signals = query.filter(
            SafetySignal.detected_at >= current_start,
            SafetySignal.detected_at <= now
        ).all()

        prior_signals = query.filter(
            SafetySignal.detected_at >= prior_start,
            SafetySignal.detected_at < current_start
        ).all()

        current_count = len(current_signals)
        prior_count = len(prior_signals)

        # Minimum absolute count guard
        if current_count < min_mentions:
            return None

        # Ratio calculation
        if prior_count == 0:
            ratio = float(current_count)
        else:
            ratio = current_count / prior_count

        if ratio < threshold_multiplier:
            return None

        prod = self.db.query(Product).filter(Product.id == product_id).first()
        prod_name = prod.name if prod else f"Product {product_id}"

        # Distinct phrases
        phrases = list(set([s.phrase for s in current_signals if s.phrase]))
        phrase_summary = ", ".join(phrases[:3]) if phrases else (hazard_keyword or "defect signals")

        explanation_dict = {
            "summary": f"Velocity spike detected for {prod_name}: defect mentions surged {ratio:.1f}x ({current_count} mentions in last {window_days}d vs {prior_count} in prior window). Flagged keywords: {phrase_summary}.",
            "rule_type": "RATE_INCREASE",
            "metric": "velocity_spike",
            "window_days": window_days,
            "threshold_multiplier": threshold_multiplier,
            "current_count": current_count,
            "prior_count": prior_count,
            "ratio": round(ratio, 2)
        }

        # Check existing active spike alert for this product to prevent duplicate spam
        existing = self.db.query(Alert).filter(
            Alert.product_id == product_id,
            Alert.alert_type == "VELOCITY_SPIKE",
            Alert.status == "ACTIVE"
        ).first()

        risk_score = round(min(70.0 + (ratio * 4.0) + (current_count * 2.0), 96.0), 1)

        if existing:
            existing.risk_score = risk_score
            existing.explanation = json.dumps(explanation_dict)
            existing.threshold = threshold_multiplier
            self.db.commit()
            return existing

        alert = Alert(
            product_id=product_id,
            alert_type="VELOCITY_SPIKE",
            threshold=threshold_multiplier,
            risk_score=risk_score,
            confidence="HIGH",
            confidence_score=0.9,
            triggered_at=now,
            status="ACTIVE",
            model_version="spike-v1.0",
            explanation=json.dumps(explanation_dict)
        )
        self.db.add(alert)
        self.db.flush()

        # Attach evidence
        for s in current_signals[:5]:
            if s.review_id:
                rev = self.db.query(Review).filter(Review.id == s.review_id).first()
                if rev:
                    ev = AlertEvidence(
                        alert_id=alert.id,
                        review_id=rev.id,
                        evidence_text=rev.body,
                        danger_phrase=s.phrase or s.signal_type,
                        relevance_score=0.95
                    )
                    self.db.add(ev)

        self.db.commit()
        self.db.refresh(alert)

        # Dispatch via Resend dispatcher if requested
        if dispatch:
            try:
                from app.alerts.resend_dispatcher import ResendAlertDispatcher
                dispatcher = ResendAlertDispatcher()
                dispatcher.dispatch_alert(
                    product={"id": prod.external_id or prod.id if prod else product_id, "name": prod_name},
                    alert={
                        "risk_score": risk_score,
                        "confidence": "HIGH",
                        "alert_type": "VELOCITY_SPIKE",
                        "explanation": explanation_dict["summary"]
                    },
                    recipient=recipient
                )
            except Exception as e:
                print(f"Resend dispatch for spike alert warning: {e}")

        return alert

    def evaluate_improvement_index(
        self,
        product_id: str,
        threshold: float = 60.0,
        window_days: int = 21,
        as_of_date: Optional[datetime] = None,
        dispatch: bool = False,
        recipient: Optional[str] = None
    ) -> Optional[Alert]:
        """
        Evaluates whether a product's Improvement Index crosses threshold (e.g. 60 or 70)
        within a configurable window (e.g. 14-21 days), and fires an Alert reusing the Resend dispatcher.
        """
        from app.models.models import ImprovementProductMetric, ImprovementSignal
        now = as_of_date or datetime.utcnow()
        window_start = now - timedelta(days=window_days)

        metric = self.db.query(ImprovementProductMetric).filter(
            ImprovementProductMetric.product_id == product_id
        ).first()

        if not metric or metric.improvement_index < threshold:
            return None

        # Check recent improvement signals within window
        recent_signals = self.db.query(ImprovementSignal).filter(
            ImprovementSignal.product_id == product_id,
            ImprovementSignal.created_at >= window_start,
            ImprovementSignal.created_at <= now
        ).all()

        prod = self.db.query(Product).filter(Product.id == product_id).first()
        prod_name = prod.name if prod else f"Product {product_id}"

        top_cluster = metric.top_cluster or "Product Enhancement"
        explanation_dict = {
            "summary": f"Improvement Index threshold reached for {prod_name}: score is {metric.improvement_index:.1f}/100 (threshold: {threshold}) across {metric.review_count} suggestions. Primary customer request: '{top_cluster}'.",
            "rule_type": "IMPROVEMENT_INDEX_SURGE",
            "metric": "improvement_index",
            "threshold": threshold,
            "window_days": window_days,
            "improvement_index": metric.improvement_index,
            "top_cluster": top_cluster,
            "recent_suggestions_count": len(recent_signals)
        }

        # Check existing active alert to prevent duplicates
        existing = self.db.query(Alert).filter(
            Alert.product_id == product_id,
            Alert.alert_type == "IMPROVEMENT_INDEX_SURGE",
            Alert.status == "ACTIVE"
        ).first()

        if existing:
            existing.risk_score = metric.improvement_index
            existing.explanation = json.dumps(explanation_dict)
            existing.threshold = threshold
            self.db.commit()
            return existing

        alert = Alert(
            product_id=product_id,
            alert_type="IMPROVEMENT_INDEX_SURGE",
            threshold=threshold,
            risk_score=metric.improvement_index,
            confidence="HIGH" if metric.improvement_index >= 70 else "MEDIUM",
            confidence_score=0.85,
            triggered_at=now,
            status="ACTIVE",
            model_version="improve-alert-v1.0",
            explanation=json.dumps(explanation_dict)
        )
        self.db.add(alert)
        self.db.flush()

        # Attach evidence
        all_signals = recent_signals if recent_signals else self.db.query(ImprovementSignal).filter(ImprovementSignal.product_id == product_id).all()
        for s in all_signals[:5]:
            rev = self.db.query(Review).filter(Review.id == s.review_id).first()
            if rev:
                ev = AlertEvidence(
                    alert_id=alert.id,
                    review_id=rev.id,
                    evidence_text=rev.body,
                    danger_phrase=f"Suggestion: {s.suggestion_text}",
                    relevance_score=s.confidence or 0.9
                )
                self.db.add(ev)

        self.db.commit()
        self.db.refresh(alert)

        if dispatch:
            try:
                from app.alerts.resend_dispatcher import ResendAlertDispatcher
                dispatcher = ResendAlertDispatcher()
                dispatcher.dispatch_alert(
                    product={"id": prod.external_id or prod.id if prod else product_id, "name": prod_name},
                    alert={
                        "risk_score": metric.improvement_index,
                        "confidence": alert.confidence,
                        "alert_type": "IMPROVEMENT_INDEX_SURGE",
                        "explanation": explanation_dict["summary"]
                    },
                    recipient=recipient
                )
            except Exception as e:
                print(f"Resend dispatch for improvement alert warning: {e}")

        return alert

