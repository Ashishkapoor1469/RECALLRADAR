import sys
import os

# Add root apps/api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from fastapi.testclient import TestClient
from app.main import app

def run_verifications():
    client = TestClient(app)
    print("============================================================")
    print("RECALLRADAR COMPLETE SYSTEM VERIFICATION SUITE")
    print("============================================================")

    # 1. System Status
    res = client.get("/api/v1/system/status")
    assert res.status_code == 200, f"System status failed: {res.status_code}"
    sys_data = res.json()
    assert sys_data["total_products"] > 0, "System products should be > 0"
    assert sys_data["total_reviews"] > 0, "System reviews should be > 0"
    print(f"[PASS] GET /api/v1/system/status -> Products: {sys_data['total_products']}, Reviews: {sys_data['total_reviews']}")

    # 2. Overview Summary
    res = client.get("/api/v1/overview/summary")
    assert res.status_code == 200
    ov_data = res.json()
    assert ov_data["total_products"] == sys_data["total_products"], "Overview total_products mismatch"
    assert ov_data["total_reviews"] == sys_data["total_reviews"], "Overview total_reviews mismatch"
    print(f"[PASS] GET /api/v1/overview/summary -> Cross-endpoint counts match ({ov_data['total_products']} products)")

    # 3. Sentiment Performance
    res_pos = client.get("/api/v1/overview/sentiment-performance?mode=positive")
    assert res_pos.status_code == 200
    assert res_pos.json()["review_count"] > 0
    res_neg = client.get("/api/v1/overview/sentiment-performance?mode=negative")
    assert res_neg.status_code == 200
    assert res_neg.json()["review_count"] > 0
    print("[PASS] GET /api/v1/overview/sentiment-performance (Positive & Negative modes)")

    # 4. Products Needing Attention
    res = client.get("/api/v1/products/attention?limit=5")
    assert res.status_code == 200
    att_data = res.json()
    assert len(att_data) > 0, "Products needing attention should be non-empty"
    assert "attention_score" in att_data[0]
    print(f"[PASS] GET /api/v1/products/attention -> Flagged top item: {att_data[0]['name']}")

    # 5. Risk Queue Server-side Pagination
    res = client.get("/api/v1/risk-queue/?page=1&page_size=10")
    assert res.status_code == 200
    rq_data = res.json()
    assert len(rq_data["items"]) <= 10
    assert rq_data["total"] == sys_data["total_products"], "Risk queue total must match system products"
    print(f"[PASS] GET /api/v1/risk-queue/ -> Paginated 10 of {rq_data['total']}")

    # 6. Trends Defects Timeline
    res = client.get("/api/v1/trends/defects")
    assert res.status_code == 200
    tr_data = res.json()
    assert len(tr_data["timeline"]) > 0
    print(f"[PASS] GET /api/v1/trends/defects -> {len(tr_data['timeline'])} timeline periods")

    # 7. Backtest Summary & Simulate
    res = client.get("/api/v1/backtests/summary")
    assert res.status_code == 200
    print("[PASS] GET /api/v1/backtests/summary -> Handled recall data state")

    res = client.get("/api/v1/backtests/simulate?budget=50&horizon=8")
    assert res.status_code == 200
    print("[PASS] GET /api/v1/backtests/simulate -> Simulation response")

    # 8. Chat Function Calling
    res = client.post("/api/v1/chat/", json={"query": "hi"})
    assert res.status_code == 200
    assert "Hello" in res.json()["answer"]
    print("[PASS] POST /api/v1/chat/ ('hi' smalltalk response)")

    res_tbl = client.post("/api/v1/chat/", json={"query": "show products with cable noise"})
    assert res_tbl.status_code == 200
    assert res_tbl.json()["table"] is not None
    print("[PASS] POST /api/v1/chat/ (Table output on 'show products' request)")

    print("============================================================")
    print("ALL API ENDPOINTS & CROSS-ENDPOINT CONSISTENCY VERIFIED!")
    print("============================================================")

if __name__ == "__main__":
    run_verifications()
