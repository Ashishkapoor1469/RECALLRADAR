from app.services.ingestion.adapters import CPSCAdapter, SaferProductsAdapter, AmazonReviewsAdapter

def test_cpsc_adapter_normalization():
    adapter = CPSCAdapter()
    raw = {
        "RecallID": "12345",
        "RecallTitle": "Recalled Portable Charger",
        "RecallDate": "2024-02-15",
        "Description": "Overheating hazard detected in charger batteries.",
        "Hazards": [{"Name": "Fire hazard"}]
    }
    assert adapter.validate(raw) is True
    norm = adapter.normalize(raw)
    assert norm["external_id"] == "12345"
    assert norm["product_name"] == "Recalled Portable Charger"
    assert norm["hazard"] == "Fire hazard"

def test_amazon_adapter_normalization():
    adapter = AmazonReviewsAdapter()
    raw = {
        "asin": "B08TEST123",
        "text": "The battery started smoking after 10 mins!",
        "rating": 1.0,
        "title": "Smoke hazard!",
        "timestamp": 1704067200000
    }
    assert adapter.validate(raw) is True
    norm = adapter.normalize(raw)
    assert norm["product_external_id"] == "B08TEST123"
    assert norm["rating"] == 1.0
    assert norm["body"] == "The battery started smoking after 10 mins!"
