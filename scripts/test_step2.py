import sys
import json
sys.path.insert(0, 'apps/api')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- 1. Testing Hold Status in Risk Queue ---")
rq = client.get("/api/v1/risk-queue/?page_size=10").json()
held_in_rq = [i for i in rq.get("items", []) if i.get("hold_status") == "ON_HOLD"]
print(f"Risk Queue Items: {len(rq.get('items', []))}, Held Items Count: {len(held_in_rq)}")
if held_in_rq:
    print("Sample Held Item in Risk Queue:")
    print(json.dumps({
        "id": held_in_rq[0]["id"],
        "name": held_in_rq[0]["name"],
        "risk_score": held_in_rq[0]["risk_score"],
        "hold_status": held_in_rq[0]["hold_status"],
        "hold_started_at": held_in_rq[0].get("hold_started_at")
    }, indent=2))

print("\n--- 2. Testing Hold Status in Products Needing Attention ---")
att = client.get("/api/v1/products/attention?limit=5").json()
held_in_att = [i for i in att.get("items", []) if i.get("hold_status") == "ON_HOLD"]
print(f"Attention Items: {len(att.get('items', []))}, Held Items Count: {len(held_in_att)}")
if held_in_att:
    print("Sample Held Item in Attention List:")
    print(json.dumps({
        "asin": held_in_att[0]["asin"],
        "title": held_in_att[0]["title"],
        "attention_score": held_in_att[0]["attention_score"],
        "hold_status": held_in_att[0]["hold_status"]
    }, indent=2))

print("\n--- 3. Testing Hold Status in Product Detail ---")
if held_in_rq:
    target_id = held_in_rq[0]["id"]
    detail = client.get(f"/api/v1/products/{target_id}").json()
    print(f"Product Detail for {target_id}:")
    print(json.dumps({
        "name": detail.get("product", {}).get("name"),
        "current_risk": detail.get("current_risk"),
        "hold_status": detail.get("hold_status"),
        "has_hold_info": detail.get("hold_info") is not None
    }, indent=2))

print("\n--- 4. Full Endpoint Suite Regression Check ---")
endpoints = [
    ("GET", "/api/v1/overview/summary", None),
    ("GET", "/api/v1/overview/stats", None),
    ("GET", "/api/v1/risk-queue/", None),
    ("GET", "/api/v1/products/attention", None),
    ("GET", "/api/v1/overview/sentiment-performance", None),
    ("GET", "/api/v1/backtests/summary", None),
    ("POST", "/api/v1/ask/", {"question": "What are the key safety concerns?"}),
    ("GET", "/api/v1/improvements/", None),
    ("GET", "/api/v1/improvements/stats", None),
    ("GET", "/api/v1/organization/holds", None)
]

all_passed = True
for method, url, payload in endpoints:
    resp = client.get(url) if method == "GET" else client.post(url, json=payload)
    if resp.status_code != 200:
        print(f"FAIL: {url} -> {resp.status_code}")
        all_passed = False

print("ALL_PASSED:", all_passed)
