from app.ml.detection.detector import SafetySignalDetector
from app.ml.risk.engine import InterpretableRiskEngine

def test_false_alarm_non_safety_reviews():
    """Ensures normal negative non-safety complaints do not trigger risk alerts."""
    detector = SafetySignalDetector()
    risk_engine = InterpretableRiskEngine()

    non_safety_reviews = [
        "Battery life is terrible! Dies in 30 minutes.",
        "Product arrived late by 5 days. Horrible shipping service.",
        "Box was damaged on delivery.",
        "Color is wrong and seat padding is uncomfortable.",
        "Overpriced piece of junk!"
    ]

    detected_signals = []
    for text in non_safety_reviews:
        signals = detector.detect(text)
        detected_signals.extend(signals)

    # Asserts 0 safety signals detected for non-safety complaints
    assert len(detected_signals) == 0

    features = {
        "product_id": "prod-control",
        "signal_count": 0,
        "recent_count": 0,
        "velocity_ratio": 1.0,
        "max_severity": 0,
        "source_agreement": 0.0,
        "unique_reporters": 0
    }
    risk_res = risk_engine.calculate_risk(features)

    # Risk score should remain low (0-20)
    assert risk_res["risk_score"] < 20.0
    assert risk_res["risk_score"] < 70.0 # Will not trigger alert
