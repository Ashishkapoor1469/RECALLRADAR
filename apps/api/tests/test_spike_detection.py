from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Product, SafetySignal, Alert, AlertEvidence, Review
from app.alerts.engine import AlertEngine

def get_test_db():
    engine = create_engine("sqlite:///:memory:")
    Product.__table__.create(engine)
    SafetySignal.__table__.create(engine)
    Alert.__table__.create(engine)
    AlertEvidence.__table__.create(engine)
    Review.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_real_spike_fires():
    db = get_test_db()
    now = datetime(2026, 9, 28, 12, 0, 0)
    prod = Product(id="prod-spike-1", name="Spike Test Product", category="Electronics")
    db.add(prod)
    
    # Prior window (14 to 28 days ago): 1 signal
    db.add(SafetySignal(product_id="prod-spike-1", phrase="sparked", signal_type="electric shock", severity=3, detected_at=now - timedelta(days=20)))
    
    # Current window (last 14 days): 5 signals (5.0x ratio >= 2.0x, 5 >= 3 min mentions)
    for d in [2, 4, 6, 8, 10]:
        db.add(SafetySignal(product_id="prod-spike-1", phrase="sparked", signal_type="electric shock", severity=3, detected_at=now - timedelta(days=d)))
    db.commit()

    engine = AlertEngine(db)
    alert = engine.evaluate_defect_spike(
        product_id="prod-spike-1",
        window_days=14,
        threshold_multiplier=2.0,
        min_mentions=3,
        as_of_date=now
    )
    assert alert is not None
    assert alert.alert_type == "VELOCITY_SPIKE"
    assert alert.risk_score >= 70.0
    assert alert.status == "ACTIVE"

def test_flat_trend_does_not_fire():
    db = get_test_db()
    now = datetime(2026, 9, 28, 12, 0, 0)
    prod = Product(id="prod-flat-1", name="Flat Trend Product", category="Electronics")
    db.add(prod)
    
    # Prior window: 4 signals
    for d in [16, 18, 20, 22]:
        db.add(SafetySignal(product_id="prod-flat-1", phrase="overheated", signal_type="overheat", severity=2, detected_at=now - timedelta(days=d)))
    
    # Current window: 4 signals (ratio 1.0x < 2.0x threshold)
    for d in [2, 4, 6, 8]:
        db.add(SafetySignal(product_id="prod-flat-1", phrase="overheated", signal_type="overheat", severity=2, detected_at=now - timedelta(days=d)))
    db.commit()

    engine = AlertEngine(db)
    alert = engine.evaluate_defect_spike(
        product_id="prod-flat-1",
        window_days=14,
        threshold_multiplier=2.0,
        min_mentions=3,
        as_of_date=now
    )
    assert alert is None

def test_low_volume_noise_does_not_fire():
    db = get_test_db()
    now = datetime(2026, 9, 28, 12, 0, 0)
    prod = Product(id="prod-noise-1", name="Noise Product", category="Electronics")
    db.add(prod)
    
    # Prior window: 1 signal
    db.add(SafetySignal(product_id="prod-noise-1", phrase="smelled like burning", signal_type="burn", severity=2, detected_at=now - timedelta(days=20)))
    
    # Current window: 2 signals (2.0x ratio, but 2 < min_mentions of 3 -> noise filter blocks it)
    db.add(SafetySignal(product_id="prod-noise-1", phrase="smelled like burning", signal_type="burn", severity=2, detected_at=now - timedelta(days=3)))
    db.add(SafetySignal(product_id="prod-noise-1", phrase="smelled like burning", signal_type="burn", severity=2, detected_at=now - timedelta(days=7)))
    db.commit()

    engine = AlertEngine(db)
    alert = engine.evaluate_defect_spike(
        product_id="prod-noise-1",
        window_days=14,
        threshold_multiplier=2.0,
        min_mentions=3,
        as_of_date=now
    )
    assert alert is None
