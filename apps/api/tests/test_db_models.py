from app.models import (
    Product, Review, SafetyReport, Recall, SafetySignal,
    ProductRiskSnapshot, Alert, AlertEvidence, AlertRule,
    BacktestRun, BacktestResult, Conversation, Message
)

def test_models_import_and_instantiation():
    product = Product(id="prod-101", name="Test Charger", category="Electronics", brand="TestBrand")
    assert product.name == "Test Charger"
    assert product.category == "Electronics"

    review = Review(id="rev-101", product_id=product.id, rating=1.0, body="Overheated and smoked!", review_date=None)
    assert review.rating == 1.0
    assert review.body == "Overheated and smoked!"

    alert = Alert(id="alt-101", product_id=product.id, alert_type="THRESHOLD_EXCEEDED", threshold=70.0, risk_score=85.0, triggered_at=None, status="ACTIVE")
    assert alert.risk_score == 85.0
    assert alert.status == "ACTIVE"

    rule = AlertRule(id="rule-101", name="Burn Spike", configuration={"signals": ["burn"], "threshold": 2}, enabled=True)
    assert rule.name == "Burn Spike"
    assert rule.enabled is True
