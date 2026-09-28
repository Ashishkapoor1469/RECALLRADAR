from app.alerts.resend_dispatcher import ResendAlertDispatcher
from app.core.config import settings

def test_webhook_alert_unset_skips_silently():
    dispatcher = ResendAlertDispatcher()
    dispatcher.webhook_url = None
    res = dispatcher.dispatch_webhook(
        product={"id": "P1", "name": "Test Prod"},
        alert={"risk_score": 85.0, "confidence": "HIGH", "alert_type": "TEST_ALERT"},
        explanation="Test explanation"
    )
    assert res is None

    # Full dispatch proceeds without error and email delivery receipt generated
    receipt = dispatcher.dispatch_alert(
        product={"id": "P1", "name": "Test Prod"},
        alert={"risk_score": 85.0, "confidence": "HIGH", "alert_type": "TEST_ALERT"},
        recipient="test@example.com"
    )
    assert receipt["status"] in ["delivered", "dispatched"]
    assert "resend_id" in receipt

def test_webhook_alert_failure_fails_soft():
    dispatcher = ResendAlertDispatcher()
    # Point to invalid/unreachable port/host to simulate network failure
    dispatcher.webhook_url = "http://127.0.0.1:59999/fake-webhook"
    res = dispatcher.dispatch_webhook(
        product={"id": "P1", "name": "Test Prod"},
        alert={"risk_score": 85.0, "confidence": "HIGH", "alert_type": "TEST_ALERT"},
        explanation="Test explanation"
    )
    # Must fail soft, returning error dict without raising an exception
    assert res is not None
    assert res["status"] in ["error", "failed"]

    # Full alert dispatch must NOT raise an exception and email must still dispatch
    receipt = dispatcher.dispatch_alert(
        product={"id": "P1", "name": "Test Prod"},
        alert={"risk_score": 85.0, "confidence": "HIGH", "alert_type": "TEST_ALERT"},
        recipient="test@example.com"
    )
    assert receipt["status"] in ["delivered", "dispatched"]
