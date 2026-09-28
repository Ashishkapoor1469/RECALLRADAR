from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import AuditLog
from app.services.audit import log_audit

client = TestClient(app)

def test_audit_log_direct_entry():
    db = SessionLocal()
    entry = log_audit(
        db=db,
        action="TEST_ACTION",
        target="test-target-123",
        detail={"user": "safety_analyst", "reason": "unit test"}
    )
    assert entry is not None
    assert entry.action == "TEST_ACTION"
    assert entry.target == "test-target-123"
    assert entry.detail["user"] == "safety_analyst"
    assert entry.timestamp is not None
    db.close()

def test_audit_log_on_rule_creation():
    db = SessionLocal()
    initial_count = db.query(AuditLog).filter(AuditLog.action == "RULE_CREATE").count()
    
    res = client.post("/api/v1/alerts/rules", json={"text": "Alert if battery explodes or bursts into flames"})
    assert res.status_code == 200
    
    after_count = db.query(AuditLog).filter(AuditLog.action == "RULE_CREATE").count()
    assert after_count == initial_count + 1
    
    latest = db.query(AuditLog).filter(AuditLog.action == "RULE_CREATE").order_by(AuditLog.timestamp.desc()).first()
    assert "battery" in latest.detail["raw_text"] or "explodes" in latest.detail["raw_text"]
    db.close()

def test_audit_log_on_csv_export():
    db = SessionLocal()
    initial_count = db.query(AuditLog).filter(AuditLog.action == "DATA_EXPORT").count()
    
    res = client.get("/api/v1/backtests/export?format=csv")
    assert res.status_code == 200
    
    after_count = db.query(AuditLog).filter(AuditLog.action == "DATA_EXPORT").count()
    assert after_count == initial_count + 1
    
    latest = db.query(AuditLog).filter(AuditLog.action == "DATA_EXPORT").order_by(AuditLog.timestamp.desc()).first()
    assert latest.target == "earlyecho_backtest_cases.csv"
    assert latest.detail["format"] == "csv"
    db.close()
