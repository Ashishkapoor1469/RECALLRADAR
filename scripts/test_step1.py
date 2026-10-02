import sys
import json
sys.path.insert(0, 'apps/api')
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import ProductHold

client = TestClient(app)

print("--- 1. Testing Sync Active Hazards & Auto-Hold Trigger ---")
sync_resp = client.post("/api/v1/organization/sync-active-hazards")
print("Sync Response Status:", sync_resp.status_code)
print("Sync Response Body:", json.dumps(sync_resp.json(), indent=2))

print("\n--- 2. Verifying DB ProductHold Rows ---")
db = SessionLocal()
holds = db.query(ProductHold).all()
print(f"Total ProductHold rows in DB: {len(holds)}")
for h in holds[:3]:
    print(f"  Hold ID: {h.id}")
    print(f"  Product ID: {h.product_id}")
    print(f"  Status: {h.status}")
    print(f"  Hazard Score: {h.hazard_score}")
    print(f"  Hold Started: {h.hold_started_at}")
    print(f"  Org Notified: {h.org_hold_notified}")
    print(f"  Org Response Preview: {str(h.org_hold_response)[:120]}")
    print(f"  Evidence Count: {len(h.evidence_citations or [])}")
    print("  ---")
db.close()

print("\n--- 3. Testing GET /api/v1/organization/holds ---")
org_holds_resp = client.get("/api/v1/organization/holds")
print("Organization Holds Status:", org_holds_resp.status_code)
print("Organization Holds Preview:", json.dumps({
    "total": org_holds_resp.json().get("total"),
    "active_on_hold": org_holds_resp.json().get("active_on_hold"),
    "first_item": org_holds_resp.json().get("items", [])[0] if org_holds_resp.json().get("items") else None
}, indent=2))

print("\n--- 4. Re-testing ALL Existing Endpoints for Zero Regression ---")
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

results = {}
all_passed = True

for method, url, payload in endpoints:
    if method == "GET":
        resp = client.get(url)
    else:
        resp = client.post(url, json=payload)
    
    st = resp.status_code
    try:
        data = resp.json()
        if isinstance(data, dict):
            preview = {k: (v if not isinstance(v, (list, dict)) else f"[{type(v).__name__} len={len(v)}]") for k, v in list(data.items())[:4]}
        elif isinstance(data, list):
            preview = f"[list len={len(data)}]"
        else:
            preview = str(data)[:100]
    except Exception:
        preview = resp.text[:100]

    results[url] = {"status": st, "preview": preview}
    if st != 200:
        all_passed = False

print(json.dumps(results, indent=2))
print("ALL_PASSED:", all_passed)
