from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Review, SafetyReport, SafetySignal

class TemporalFeatureExtractor:
    """Extracts risk features strictly bound by timestamp T to ensure zero temporal leakage."""

    def __init__(self, db: Session):
        self.db = db

    def extract_features(self, product_id: str, as_of_date: datetime) -> Dict[str, Any]:
        """Extract features considering ONLY records dated <= as_of_date."""
        
        # 1. Fetch safety signals dated <= as_of_date
        signals = self.db.query(SafetySignal).filter(
            SafetySignal.product_id == product_id,
            SafetySignal.detected_at <= as_of_date
        ).all()

        signal_count = len(signals)
        max_severity = max([s.severity for s in signals], default=0)

        # 2. Velocity over 14-day windows <= as_of_date
        window_start_recent = as_of_date - timedelta(days=14)
        window_start_prior = as_of_date - timedelta(days=28)

        recent_signals = [s for s in signals if s.detected_at > window_start_recent]
        prior_signals = [s for s in signals if window_start_prior < s.detected_at <= window_start_recent]

        recent_count = len(recent_signals)
        prior_count = len(prior_signals)

        velocity_growth = (recent_count - prior_count) / max(prior_count, 1)
        velocity_ratio = (recent_count + 1) / (prior_count + 1)

        # 3. Source agreement <= as_of_date
        reports = self.db.query(SafetyReport).filter(
            SafetyReport.product_id == product_id,
            SafetyReport.report_date <= as_of_date
        ).all()
        report_count = len(reports)
        source_agreement = 1.0 if (signal_count > 0 and report_count > 0) else 0.0

        # 4. Unique reporters
        unique_reporters = len(set([s.review_id for s in signals if s.review_id] + [s.report_id for s in signals if s.report_id]))

        return {
            "product_id": product_id,
            "as_of_date": as_of_date,
            "signal_count": signal_count,
            "recent_count": recent_count,
            "prior_count": prior_count,
            "velocity_growth": float(velocity_growth),
            "velocity_ratio": float(velocity_ratio),
            "max_severity": max_severity,
            "source_agreement": source_agreement,
            "unique_reporters": unique_reporters,
            "report_count": report_count
        }
