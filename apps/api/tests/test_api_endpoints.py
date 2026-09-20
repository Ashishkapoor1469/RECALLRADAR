from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "RecallRadar" in response.json()["message"]

def test_ask_endpoint_hallucination_refusal():
    response = client.post("/api/v1/ask/", json={"query": "What did the manufacturer say in their press release?"})
    assert response.status_code == 200
    data = response.json()
    assert "don't have manufacturer statements" in data["answer"]
