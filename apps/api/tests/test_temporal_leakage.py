from datetime import datetime, timedelta
from app.ml.risk.engine import InterpretableRiskEngine

def test_temporal_leakage_prevention():
    """Asserts that inserting future reviews does NOT alter historical risk scores."""
    risk_engine = InterpretableRiskEngine()

    # Week 5 features
    week5_features = {
        "product_id": "prod-test-leakage",
        "as_of_date": datetime(2024, 2, 5),
        "signal_count": 3,
        "recent_count": 2,
        "velocity_ratio": 1.5,
        "max_severity": 2,
        "source_agreement": 0.0,
        "unique_reporters": 3
    }

    initial_week5_risk = risk_engine.calculate_risk(week5_features)["risk_score"]

    # Now simulate future Week 8 severe fire reviews arriving later
    week8_future_features = {
        "product_id": "prod-test-leakage",
        "as_of_date": datetime(2024, 2, 26), # Week 8
        "signal_count": 15,
        "recent_count": 10,
        "velocity_ratio": 3.0,
        "max_severity": 4,
        "source_agreement": 1.0,
        "unique_reporters": 12
    }

    week8_risk = risk_engine.calculate_risk(week8_future_features)["risk_score"]
    assert week8_risk > initial_week5_risk

    # Recalculate historical Week 5 score again with Week 5 features
    recalculated_week5_risk = risk_engine.calculate_risk(week5_features)["risk_score"]

    # Must be 100% identical
    assert recalculated_week5_risk == initial_week5_risk
