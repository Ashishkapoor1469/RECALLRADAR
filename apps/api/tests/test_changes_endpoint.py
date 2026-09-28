import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from sqlalchemy.exc import OperationalError

from app.main import app
from app.db.session import get_db, SessionLocal
from app.models import Review, Product, SafetySignal
import app.api.v1.system as system_module

client = TestClient(app)

def test_system_changes_endpoint_schema():
    """Verify GET /api/v1/system/changes returns all expected change tokens."""
    # Reset cache so we test fresh fetch
    system_module._changes_cache["payload"] = None

    response = client.get("/api/v1/system/changes")
    assert response.status_code == 200
    data = response.json()

    assert "reviews" in data
    assert "products" in data
    assert "alerts" in data
    assert "signals" in data
    assert "version" in data

    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0
    assert ":" in data["reviews"]
    assert ":" in data["products"]

def test_system_changes_cache_performance():
    """Verify that back-to-back requests are served from in-memory cache under 50ms."""
    # Seed cache
    resp1 = client.get("/api/v1/system/changes")
    assert resp1.status_code == 200

    start_time = time.time()
    resp2 = client.get("/api/v1/system/changes")
    elapsed_ms = (time.time() - start_time) * 1000

    assert resp2.status_code == 200
    assert resp1.json()["version"] == resp2.json()["version"]
    assert elapsed_ms < 50.0  # In-memory cache is sub-millisecond

def test_system_changes_updates_token_on_new_data():
    """Verify that inserting a new review updates the change token."""
    # Reset cache
    system_module._changes_cache["payload"] = None

    db = SessionLocal()
    try:
        # Get initial token
        resp1 = client.get("/api/v1/system/changes")
        assert resp1.status_code == 200
        initial_version = resp1.json()["version"]
        initial_reviews = resp1.json()["reviews"]

        # Insert a transient review
        product = db.query(Product).first()
        if product:
            new_review = Review(
                product_id=product.id,
                rating=1.0,
                title="Transient Test Review",
                body="Testing change token reactivity with hot spark defect",
                review_date=time.strftime("%Y-%m-%d %H:%M:%S")
            )
            db.add(new_review)
            db.commit()

            try:
                # Force cache expiry
                system_module._changes_cache["payload"] = None

                resp2 = client.get("/api/v1/system/changes")
                assert resp2.status_code == 200
                new_version = resp2.json()["version"]
                new_reviews = resp2.json()["reviews"]

                assert new_version != initial_version or new_reviews != initial_reviews
            finally:
                db.delete(new_review)
                db.commit()
                system_module._changes_cache["payload"] = None
    finally:
        db.close()

def test_system_changes_db_unreachable_returns_503():
    """Verify that when database is unreachable, 503 Service Unavailable is returned (no fake 200)."""
    system_module._changes_cache["payload"] = None

    mock_db = MagicMock()
    mock_db.execute.side_effect = OperationalError("connection refused", {}, None)

    app.dependency_overrides[system_module.get_optional_db] = lambda: mock_db
    try:
        response = client.get("/api/v1/system/changes")
        assert response.status_code == 503
        assert "Database unreachable" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
        system_module._changes_cache["payload"] = None
