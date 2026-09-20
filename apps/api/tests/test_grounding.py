from app.services.explanation import ExplanationService

def test_explanation_grounding_and_fallback():
    service = ExplanationService()
    
    alert = {"risk_score": 85.0, "confidence": "High"}
    product = {"name": "Demo Smart Charger Pro 65W"}
    evidence_items = [
        {"id": "R-00007", "evidence_text": "The charger caught fire on my nightstand!"},
        {"id": "R-00005", "evidence_text": "Unit started smoking while charging."}
    ]

    exp = service.generate_explanation(alert, product, evidence_items)
    
    assert "summary" in exp
    assert "evidence" in exp
    assert len(exp["evidence"]) == 2
    
    # Assert every evidence item contains citation ID
    citation_ids = [e["id"] for e in exp["evidence"]]
    assert "R-00007" in citation_ids
    assert "R-00005" in citation_ids
