import sys
import json
sys.path.insert(0, 'apps/api')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

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
    ("GET", "/api/v1/organization/holds", None),
]

results = {}
all_passed = True

for method, url, payload in endpoints:
    try:
        if method == "GET":
            resp = client.get(url)
        else:
            resp = client.post(url, json=payload)
        
        status = resp.status_code
        try:
            data = resp.json()
            if isinstance(data, dict):
                # brief summary preview
                preview = {k: (v if not isinstance(v, (list, dict)) else f"[{type(v).__name__} len={len(v)}]") for k, v in list(data.items())[:5]}
            elif isinstance(data, list):
                preview = f"[list len={len(data)}, first={data[0] if data else None}]"
            else:
                preview = str(data)[:100]
        except Exception:
            preview = resp.text[:100]

        results[url] = {
            "status": status,
            "preview": preview
        }
        if status != 200:
            all_passed = False
    except Exception as e:
        results[url] = {"status": "ERROR", "error": str(e)}
        all_passed = False

print(json.dumps(results, indent=2))
print("ALL_PASSED:", all_passed)
