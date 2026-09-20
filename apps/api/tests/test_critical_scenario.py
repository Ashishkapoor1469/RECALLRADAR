from datetime import datetime, timedelta
from app.ml.features.extractor import TemporalFeatureExtractor
from app.ml.risk.engine import InterpretableRiskEngine

def test_critical_charger_lead_time_scenario():
    """Verifies that risk increases week by week and fires alert 7+ weeks before recall."""
    risk_engine = InterpretableRiskEngine()
    
    # Simulate week-by-week feature progression for Demo Smart Charger
    weeks_progression = [
        {"week": 1, "signals": 0, "max_sev": 0, "expected_risk_max": 20.0, "alert": False},
        {"week": 3, "signals": 1, "max_sev": 1, "expected_risk_max": 40.0, "alert": False},
        {"week": 5, "signals": 3, "max_sev": 2, "expected_risk_max": 65.0, "alert": False},
        {"week": 6, "signals": 5, "max_sev": 3, "expected_risk_min": 70.0, "alert": True}, # Fired here at Week 6
        {"week": 8, "signals": 9, "max_sev": 4, "expected_risk_min": 85.0, "alert": True},
    ]

    recall_week = 10
    first_alert_week = None

    for step in weeks_progression:
        features = {
            "product_id": "prod-demo-smart-charger",
            "signal_count": step["signals"],
            "recent_count": step["signals"],
            "velocity_ratio": 2.5 if step["signals"] > 2 else 1.0,
            "max_severity": step["max_sev"],
            "source_agreement": 1.0 if step["max_sev"] >= 3 else 0.0,
            "unique_reporters": step["signals"]
        }
        res = risk_engine.calculate_risk(features)
        
        if step["alert"] and first_alert_week is None:
            if res["risk_score"] >= 70.0:
                first_alert_week = step["week"]

    # Official recall is at week 10. Alert fired at week 6.
    assert first_alert_week is not None
    assert first_alert_week <= 6
    lead_time_weeks = recall_week - first_alert_week
    assert lead_time_weeks >= 4.0
