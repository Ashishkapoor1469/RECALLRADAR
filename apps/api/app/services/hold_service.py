import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models import Product, Review, SafetySignal, ProductRiskSnapshot, ProductHold
from app.services.org_client import OrgClient

logger = logging.getLogger(__name__)

class HoldService:
    def __init__(self, db: Session, org_client: Optional[OrgClient] = None):
        self.db = db
        self.org_client = org_client or OrgClient()

    def trigger_auto_hold(
        self,
        product_id: str,
        risk_score: float,
        threshold: float = 70.0,
        reason: Optional[str] = None
    ) -> Optional[ProductHold]:
        """
        Evaluates risk score against critical threshold. If exceeded:
        1. Calls the organization hold API endpoint (pull from sale).
        2. Persists/updates the hold record in product_holds table with status 'ON_HOLD'.
        """
        if risk_score < threshold:
            return None

        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None

        # Build evidence citations from recent signals and negative reviews
        signals = self.db.query(SafetySignal).filter(SafetySignal.product_id == product_id).all()
        recent_revs = (
            self.db.query(Review)
            .filter(Review.product_id == product_id, Review.rating <= 3.0)
            .order_by(Review.review_date.desc())
            .limit(5)
            .all()
        )

        evidence_list: List[Dict[str, Any]] = []
        for r in recent_revs:
            evidence_list.append({
                "review_id": r.id,
                "rating": r.rating,
                "title": r.title or "Customer Feedback",
                "body": r.body[:300] if r.body else "",
                "date": r.review_date.strftime("%Y-%m-%d") if r.review_date else None,
                "danger_phrase": next((s.phrase for s in signals if s.review_id == r.id), None)
            })

        if not reason:
            phrases = list(set([s.phrase for s in signals if s.phrase]))
            phrase_str = f" Flagged defect triggers: {', '.join(phrases[:3])}." if phrases else ""
            reason = f"Hazard score {risk_score:.1f} crossed critical safety threshold {threshold:.1f}.{phrase_str}"

        # Check for existing active hold
        active_hold = (
            self.db.query(ProductHold)
            .filter(ProductHold.product_id == product_id, ProductHold.status == "ON_HOLD")
            .order_by(ProductHold.hold_started_at.desc())
            .first()
        )

        if active_hold:
            active_hold.hazard_score = risk_score
            active_hold.reason = reason
            active_hold.evidence_citations = evidence_list
            active_hold.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(active_hold)
            return active_hold

        # Call organization hold API
        org_resp = self.org_client.call_hold_endpoint(
            product_id=product.external_id or product.id,
            product_name=product.name,
            hazard_score=round(risk_score, 1),
            threshold=threshold,
            reason=reason,
            evidence_citations=evidence_list
        )

        # Create new product hold record
        now = datetime.utcnow()
        hold = ProductHold(
            product_id=product.id,
            status="ON_HOLD",
            hazard_score=round(risk_score, 1),
            threshold=threshold,
            reason=reason,
            evidence_citations=evidence_list,
            hold_started_at=now,
            org_hold_notified=True,
            org_hold_response=org_resp,
            created_at=now,
            updated_at=now
        )
        self.db.add(hold)
        self.db.commit()
        self.db.refresh(hold)

        # Log audit trail
        try:
            from app.services.audit import log_audit
            log_audit(
                db=self.db,
                action="PRODUCT_HOLD_TRIGGERED",
                target=product.id,
                detail={
                    "product_name": product.name,
                    "hazard_score": risk_score,
                    "threshold": threshold,
                    "hold_id": hold.id,
                    "org_response_success": org_resp.get("success", False)
                }
            )
        except Exception as e:
            logger.warning(f"Audit log warning: {e}")

        try:
            from app.services.cache_service import CacheService
            CacheService.invalidate("cache:product_risk_list")
            CacheService.invalidate("cache:overview_summary")
        except Exception:
            pass

        return hold

    def recheck_product_hazard(self, product_id: str) -> Dict[str, Any]:
        """
        Recalculates the product's hazard score in real-time from active reviews and signals.
        Never blindly trusts a status reset.
        """
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return {
                "product_id": product_id,
                "recalculated_score": 0.0,
                "threshold": 70.0,
                "is_above_threshold": False,
                "signal_count": 0,
                "negative_reviews": 0,
                "message": "Product not found"
            }

        all_p_signals = self.db.query(SafetySignal).filter(SafetySignal.product_id == product_id).all()
        sig_count = len(all_p_signals)
        max_sev = max([s.severity for s in all_p_signals], default=0)
        neg_count = self.db.query(Review).filter(Review.product_id == product_id, Review.rating <= 3.0).count()
        total_revs = self.db.query(Review).filter(Review.product_id == product_id).count()

        if sig_count > 0:
            current_score = min(sig_count * 14.5 + max_sev * 10.0, 92.0)
        elif neg_count > 0:
            current_score = min(neg_count * 3.5, 45.0)
        else:
            current_score = 12.0

        current_score = round(current_score, 1)
        threshold = 70.0
        is_above = current_score >= threshold

        return {
            "product_id": product.id,
            "product_name": product.name,
            "recalculated_score": current_score,
            "threshold": threshold,
            "is_above_threshold": is_above,
            "signal_count": sig_count,
            "negative_reviews": neg_count,
            "total_reviews": total_revs,
            "warning": "Hazard score remains elevated above safety threshold (70.0). Resuming requires supervisor override confirmation." if is_above else None
        }

    def resume_product(
        self,
        product_id: str,
        force_resume: bool = False,
        resolved_by: str = "Safety Committee Officer",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the resume workflow:
        1. Recalculates hazard score against current live data.
        2. If score is still >= threshold and force_resume is False, halts with warning.
        3. Calls organization resume endpoint.
        4. Updates hold status to 'RESOLVED' and sets resolved_at timestamp.
        """
        recheck = self.recheck_product_hazard(product_id)
        if recheck["is_above_threshold"] and not force_resume:
            return {
                "success": False,
                "requires_confirmation": True,
                "status": "ELEVATED_RISK_WARNING",
                "message": f"Hazard score is {recheck['recalculated_score']}, which remains above critical threshold ({recheck['threshold']}). Resuming requires explicit confirmation.",
                "recheck": recheck
            }

        hold = (
            self.db.query(ProductHold)
            .filter(ProductHold.product_id == product_id, ProductHold.status == "ON_HOLD")
            .order_by(ProductHold.hold_started_at.desc())
            .first()
        )

        product = self.db.query(Product).filter(Product.id == product_id).first()
        prod_name = product.name if product else "Product"

        # Call organization resume endpoint
        org_resume_resp = self.org_client.call_resume_endpoint(
            product_id=product.external_id or product_id if product else product_id,
            product_name=prod_name,
            hazard_score=recheck["recalculated_score"],
            resolved_by=resolved_by,
            notes=notes or f"Cleared for sales. Score re-evaluated at {recheck['recalculated_score']}."
        )

        now = datetime.utcnow()
        if not hold:
            # Create a resolved record if not previously tracked
            hold = ProductHold(
                product_id=product_id,
                status="RESOLVED",
                hazard_score=recheck["recalculated_score"],
                threshold=70.0,
                reason="Direct safety clearance",
                hold_started_at=now,
                created_at=now
            )
            self.db.add(hold)

        hold.status = "RESOLVED"
        hold.resolved_at = now
        hold.resolved_by = resolved_by
        hold.resolve_reason = notes or (
            f"Supervisor override confirmed (recheck score {recheck['recalculated_score']})"
            if recheck["is_above_threshold"]
            else f"Hazard signal subsided (recheck score {recheck['recalculated_score']})"
        )
        hold.recheck_score = recheck["recalculated_score"]
        hold.recheck_at = now
        hold.org_resume_notified = True
        hold.org_resume_response = org_resume_resp
        hold.updated_at = now

        self.db.commit()
        self.db.refresh(hold)

        # Log audit trail
        try:
            from app.services.audit import log_audit
            log_audit(
                db=self.db,
                action="PRODUCT_HOLD_RESUMED",
                target=product_id,
                detail={
                    "product_name": prod_name,
                    "recheck_score": recheck["recalculated_score"],
                    "forced": force_resume,
                    "resolved_by": resolved_by
                }
            )
        except Exception as e:
            logger.warning(f"Audit log warning: {e}")

        try:
            from app.services.cache_service import CacheService
            CacheService.invalidate("cache:product_risk_list")
            CacheService.invalidate("cache:overview_summary")
        except Exception:
            pass

        return {
            "success": True,
            "status": "RESOLVED",
            "message": f"Product successfully resumed. Sales channels restored.",
            "hold_id": hold.id,
            "product_id": product_id,
            "recheck": recheck,
            "resolved_at": hold.resolved_at.isoformat() if hold.resolved_at else None,
            "org_response": org_resume_resp
        }

    def get_bulk_hold_statuses(self, resolved_grace_hours: int = 72) -> Dict[str, Dict[str, Any]]:
        """
        Returns a dictionary mapping product_id to its current hold state:
        - 'ON_HOLD'
        - 'RESOLVED' (if resolved within grace window, e.g. 72h / 3 days)
        - 'NORMAL'
        """
        holds = (
            self.db.query(ProductHold)
            .order_by(ProductHold.created_at.desc())
            .all()
        )

        statuses: Dict[str, Dict[str, Any]] = {}
        now = datetime.utcnow()
        grace_delta = timedelta(hours=resolved_grace_hours)

        for h in holds:
            if h.product_id in statuses:
                continue

            if h.status == "ON_HOLD":
                statuses[h.product_id] = {
                    "status": "ON_HOLD",
                    "hold_id": h.id,
                    "hold_started_at": h.hold_started_at.strftime("%Y-%m-%d %H:%M:%S") if h.hold_started_at else None,
                    "hazard_score": h.hazard_score,
                    "reason": h.reason,
                    "evidence_citations": h.evidence_citations or []
                }
            elif h.status == "RESOLVED":
                if h.resolved_at and (now - h.resolved_at) <= grace_delta:
                    statuses[h.product_id] = {
                        "status": "RESOLVED",
                        "hold_id": h.id,
                        "hold_started_at": h.hold_started_at.strftime("%Y-%m-%d %H:%M:%S") if h.hold_started_at else None,
                        "resolved_at": h.resolved_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "resolved_by": h.resolved_by,
                        "hazard_score": h.hazard_score,
                        "recheck_score": h.recheck_score
                    }
                else:
                    statuses[h.product_id] = {"status": "NORMAL"}
            else:
                statuses[h.product_id] = {"status": "NORMAL"}

        return statuses
