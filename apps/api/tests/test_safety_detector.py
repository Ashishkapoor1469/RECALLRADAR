from app.ml.detection.detector import SafetySignalDetector

def test_safety_detector_phrases():
    detector = SafetySignalDetector()
    
    text1 = "The charger adapter became extremely hot and started smoking!"
    results1 = detector.detect(text1)
    assert len(results1) >= 2
    types1 = [r["signal_type"] for r in results1]
    assert "overheat" in types1 or "smoke" in types1

    text2 = "This toy caught fire on my nightstand and burned my hand."
    results2 = detector.detect(text2)
    assert len(results2) >= 2
    severities2 = [r["severity"] for r in results2]
    assert 4 in severities2

def test_safety_language_false_positives():
    detector = SafetySignalDetector()
    
    # Should NOT trigger safety alert
    text_normal = "I made burnt toast in the kitchen this morning while drinking coffee."
    results = detector.detect(text_normal)
    assert len(results) == 0

    text_deal = "This is a fire deal at a shocking price!"
    results_deal = detector.detect(text_deal)
    assert len(results_deal) == 0
