import sys
import uuid
import json
sys.path.insert(0, 'apps/api')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=====================================================================")
print("=== STEP 5: FULL END-TO-END LOOP TEST (WEB 2 REVIEW -> HOLD -> RESUME)")
print("=====================================================================")

# Stage 1: Create a distinct fresh product to monitor
unique_suffix = str(uuid.uuid4())[:6].upper()
product_name = f"Test Monitor Pro Amplifier {unique_suffix}"
asin = f"TEST-AMP-{unique_suffix}"

print(f"\n[STAGE 1] Submitting first normal review via Web 2 portal for: {product_name}")
normal_review_payload = {
    "product_name": product_name,
    "brand": "ProSound Labs",
    "category": "Musical Instruments",
    "rating": 5.0,
    "title": "Clean sound and solid build",
    "body": "Received the unit in good condition. Nice volume and clean audio tones without any issues.",
    "reviewer_name": "Verified Purchaser",
    "source": "WEB 2 Review Portal"
}

r1 = client.post("/api/v1/reviews/submit", json=normal_review_payload)
print("Normal Review Submit Status:", r1.status_code)
d1 = r1.json()
product_id = d1["product"]["id"]
print(f"Product Initialized: ID={product_id}, Score={d1['product']['updated_risk_score']}, HoldStatus={d1['product']['hold_status']}")
assert d1["product"]["hold_status"] == "NORMAL"
assert d1["product"]["updated_risk_score"] < 70.0

# Stage 2: Submit a critical hazard review via Web 2 review portal
print(f"\n[STAGE 2] Submitting CRITICAL HAZARD review via Web 2 portal for product {product_id}...")
hazard_review_payload = {
    "product_id": product_id,
    "product_name": product_name,
    "brand": "ProSound Labs",
    "category": "Musical Instruments",
    "rating": 1.0,
    "title": "DANGER! Power adapter overheated, smoked, and caught fire!",
    "body": "WARNING: I plugged this in for 15 minutes, smelled burning plastic, saw thick smoke coming out, and then the power adapter caught fire! Left a painful burn on my hand.",
    "reviewer_name": "Critical Safety Tester",
    "source": "WEB 2 Review Portal"
}

r2 = client.post("/api/v1/reviews/submit", json=hazard_review_payload)
print("Hazard Review Submit Status:", r2.status_code)
d2 = r2.json()
print("Submit Response Preview:")
print(json.dumps({
    "success": d2.get("success"),
    "product_name": d2["product"]["name"],
    "updated_risk_score": d2["product"]["updated_risk_score"],
    "hold_status": d2["product"]["hold_status"],
    "auto_hold": d2.get("auto_hold"),
    "detected_signals_count": d2.get("signals_count")
}, indent=2))

assert d2["product"]["updated_risk_score"] >= 70.0, "Hazard score should have spiked above 70"
assert d2["product"]["hold_status"] == "ON_HOLD", "Product must be automatically marked ON_HOLD"
assert d2.get("auto_hold") is not None, "Auto-hold record info must be returned"
print(">>> Auto-hold successfully triggered directly from Web 2 review submission!")

# Stage 3: Verify the hold is listed in Organization tab & Product detail
print(f"\n[STAGE 3] Checking Organization Hold Registry for {product_id}...")
org_holds = client.get("/api/v1/organization/holds?status=ON_HOLD").json()
matching_holds = [h for h in org_holds.get("items", []) if h["product_id"] == product_id]
assert len(matching_holds) > 0, "Product must appear in Organization Active Holds"
print("Found in Organization Registry:")
print(json.dumps({
    "hold_id": matching_holds[0]["id"],
    "hazard_score": matching_holds[0]["hazard_score"],
    "reason": matching_holds[0]["reason"],
    "evidence_count": len(matching_holds[0]["evidence_citations"]),
    "first_evidence": matching_holds[0]["evidence_citations"][0] if matching_holds[0]["evidence_citations"] else None
}, indent=2))

print(f"\nChecking Product Detail endpoint for badge status...")
p_detail = client.get(f"/api/v1/products/{product_id}").json()
print(f"Product Detail: current_risk={p_detail.get('current_risk')}, hold_status={p_detail.get('hold_status')}")
assert p_detail.get("hold_status") == "ON_HOLD"

# Stage 4: Test Resume Flow with Live Recheck
print(f"\n[STAGE 4] Executing Live Re-Check before resuming...")
recheck = client.post(f"/api/v1/organization/holds/{product_id}/recheck").json()
print("Live Recheck Output:", json.dumps(recheck, indent=2))
assert recheck["is_above_threshold"] is True
assert recheck["recalculated_score"] >= 70.0

print("\nAttempting resume without override (testing safeguard):")
try_unconfirmed = client.post(f"/api/v1/organization/holds/{product_id}/resume", json={
    "force_resume": False
}).json()
print("Safeguard Response:", json.dumps(try_unconfirmed, indent=2))
assert try_unconfirmed.get("requires_confirmation") is True

print("\nAuthorizing resume with supervisor confirmation...")
resume_confirmed = client.post(f"/api/v1/organization/holds/{product_id}/resume", json={
    "force_resume": True,
    "resolved_by": "Senior Safety Officer (Web2 E2E Test)",
    "notes": "Verified defective batch quarantined; power adapter replaced with UL-listed revision."
}).json()
print("Resume Confirmed Response:", json.dumps(resume_confirmed, indent=2))
assert resume_confirmed.get("success") is True
assert resume_confirmed.get("status") == "RESOLVED"

# Stage 5: Confirm RESOLVED badge reflection in Product Detail & Organization Registry
print(f"\n[STAGE 5] Verifying post-resume status across endpoints...")
p_detail_after = client.get(f"/api/v1/products/{product_id}").json()
print(f"Post-Resume Product Detail hold_status: {p_detail_after.get('hold_status')}")
assert p_detail_after.get("hold_status") == "RESOLVED"

resolved_holds = client.get("/api/v1/organization/holds?status=RESOLVED").json()
matching_resolved = [h for h in resolved_holds.get("items", []) if h["product_id"] == product_id]
assert len(matching_resolved) > 0
print("Resolved Hold Entry:")
print(json.dumps({
    "product_name": matching_resolved[0]["product_name"],
    "status": matching_resolved[0]["status"],
    "resolved_at": matching_resolved[0]["resolved_at"],
    "resolved_by": matching_resolved[0]["resolved_by"],
    "resolve_reason": matching_resolved[0]["resolve_reason"]
}, indent=2))

print("\n[STAGE 6] Final Regression Check on all other tabs:")
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
        all_passed = False

print("ALL EXISTING ENDPOINTS 200 OK:", all_passed)
print("\n>>> FULL END-TO-END LOOP TEST COMPLETED SUCCESSFULLY!")
