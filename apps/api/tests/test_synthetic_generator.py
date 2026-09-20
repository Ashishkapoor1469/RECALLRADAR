from data.synthetic.generator import generate_synthetic_dataset

def test_synthetic_dataset_generation():
    data = generate_synthetic_dataset()
    
    assert len(data["products"]) >= 5
    assert len(data["reviews"]) > 20
    assert len(data["recalls"]) >= 4

    # Verify Demo Smart Charger exists and has planted defect review progression
    charger = next(p for p in data["products"] if "Smart Charger" in p["name"])
    assert charger is not None

    charger_reviews = [r for r in data["reviews"] if r["product_id"] == charger["id"]]
    assert len(charger_reviews) >= 15

    # Check that safety reviews exist with burn/fire/smoke phrases
    safety_phrases = [r["phrase"] for r in charger_reviews if r.get("is_safety")]
    assert "gets unusually hot" in safety_phrases
    assert "started smoking" in safety_phrases
    assert "caught fire" in safety_phrases
