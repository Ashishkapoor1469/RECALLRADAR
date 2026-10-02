import sys
import json
sys.path.insert(0, 'apps/api')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- 1. Fetching an active hold ---")
holds_resp = client.get("/api/v1/organization/holds?status=ON_HOLD").json()
active_items = holds_resp.get("items", [])
assert len(active_items) > 0, "No active holds found to test"
target = active_items[0]
prod_id = target["product_id"]
print(f"Target Product: {target['product_name']} ({prod_id}), Initial Score: {target['hazard_score']}")

print("\n--- 2. Testing Live Hazard Recheck ---")
recheck_resp = client.post(f"/api/v1/organization/holds/{prod_id}/recheck")
print("Recheck Status:", recheck_resp.status_code)
recheck_data = recheck_resp.json()
print("Recheck Result:", json.dumps(recheck_data, indent=2))
assert "recalculated_score" in recheck_data
assert "is_above_threshold" in recheck_data

print("\n--- 3. Testing Resume Selling WITHOUT Confirmation (Should Warn if Elevated) ---")
resume_attempt1 = client.post(f"/api/v1/organization/holds/{prod_id}/resume", json={
    "force_resume": False,
    "notes": "Attempt without override"
})
print("Attempt 1 Status:", resume_attempt1.status_code)
attempt1_data = resume_attempt1.json()
print("Attempt 1 Result:", json.dumps(attempt1_data, indent=2))

if recheck_data["is_above_threshold"]:
    assert attempt1_data.get("requires_confirmation") is True, "Must require confirmation when score is elevated!"
    assert attempt1_data.get("success") is False
    print("SUCCESS: Endpoint refused silent resume and requested supervisor confirmation!")

print("\n--- 4. Testing Resume Selling WITH Explicit Confirmation ---")
resume_attempt2 = client.post(f"/api/v1/organization/holds/{prod_id}/resume", json={
    "force_resume": True,
    "resolved_by": "Safety Officer Test Run",
    "notes": "Engineering inspection verified hardware revision B"
})
print("Attempt 2 Status:", resume_attempt2.status_code)
attempt2_data = resume_attempt2.json()
print("Attempt 2 Result:", json.dumps(attempt2_data, indent=2))
assert attempt2_data.get("success") is True
assert attempt2_data.get("status") == "RESOLVED"
assert attempt2_data.get("resolved_at") is not None
print("SUCCESS: Product successfully resolved with persistent timestamp and org API call!")

print("\n--- 5. Verifying Hold Detail & Status Reflection ---")
detail = client.get(f"/api/v1/products/{prod_id}").json()
print(f"Product Detail Status for {prod_id}: {detail.get('hold_status')}")
assert detail.get("hold_status") == "RESOLVED"

print("\n--- 6. Re-testing ALL Existing Endpoints for Zero Regression ---")
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
