import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

PLANTED_SCENARIOS = [
    {
        "name": "Demo Smart Charger Pro 65W",
        "brand": "VoltTech",
        "category": "Electronics",
        "subcategory": "Chargers & Adapters",
        "description": "Fast multi-port USB-C wall charger with smart power delivery.",
        "recall_hazard": "The charger adapter can overheat and melt, posing fire and burn hazards.",
        "recall_remedy": "Consumers should immediately stop using the recalled chargers and contact VoltTech for a full refund.",
        "recall_week": 10, # Weeks after start
        "start_date": "2024-01-01",
        "review_timeline": [
            # Week 1: Normal reviews
            {"week": 1, "count": 5, "rating": 5.0, "title": "Great fast charger", "body": "Charges my phone extremely quickly. Compact design!", "safety": False},
            {"week": 1, "count": 3, "rating": 4.0, "title": "Good quality", "body": "Works fine for laptop and phone.", "safety": False},
            # Week 3: Weak early signal
            {"week": 3, "count": 4, "rating": 4.0, "title": "Decent charger", "body": "Charges fine, though the block gets unusually hot during heavy use.", "safety": True, "phrase": "gets unusually hot", "signal_type": "overheat", "severity": 1},
            # Week 5: Increasing signal
            {"week": 5, "count": 3, "rating": 2.0, "title": "Concerned about heat", "body": "After 30 mins charging, it smelled like burning plastic. Charger became extremely hot.", "safety": True, "phrase": "smelled like burning", "signal_type": "burn", "severity": 2},
            {"week": 5, "count": 2, "rating": 1.0, "title": "Overheating adapter", "body": "The adapter overheated on my desk. Extremely hot to touch.", "safety": True, "phrase": "adapter overheated", "signal_type": "overheat", "severity": 2},
            # Week 6: Severe signal
            {"week": 6, "count": 3, "rating": 1.0, "title": "DANGEROUS!", "body": "Unit started smoking while charging my iPad. Unplugged it immediately!", "safety": True, "phrase": "started smoking", "signal_type": "smoke", "severity": 3},
            # Week 7: Severe hazard & fire
            {"week": 7, "count": 2, "rating": 1.0, "title": "CAUGHT FIRE", "body": "This charger caught fire on my nightstand! Burned my hand when pulling the cord.", "safety": True, "phrase": "caught fire", "signal_type": "fire", "severity": 4},
            # Week 8: Multiple independent severe complaints
            {"week": 8, "count": 4, "rating": 1.0, "title": "Extremely unsafe product", "body": "Melted my wall socket and created a fire hazard in my bedroom.", "safety": True, "phrase": "fire hazard", "signal_type": "fire", "severity": 4},
        ]
    },
    {
        "name": "Soft Plush Teddy Bear with Button Eyes",
        "brand": "CuddleBuddies",
        "category": "Toys",
        "subcategory": "Plush Toys",
        "description": "Classic stuffed brown teddy bear for toddlers and babies.",
        "recall_hazard": "Button eyes can detach easily, posing a choking hazard to young children.",
        "recall_remedy": "Dispose of toy or return for plush eyes replacement kit.",
        "recall_week": 12,
        "start_date": "2024-01-01",
        "review_timeline": [
            {"week": 1, "count": 6, "rating": 5.0, "title": "Super soft bear", "body": "My toddler loves hugging this bear to sleep!", "safety": False},
            {"week": 4, "count": 3, "rating": 3.0, "title": "Cute but loose threads", "body": "The plastic button eye seems a bit loose.", "safety": True, "phrase": "button eye loose", "signal_type": "choking", "severity": 1},
            {"week": 7, "count": 4, "rating": 1.0, "title": "CHOKING HAZARD", "body": "Eye popped off! Child almost choked on the small plastic piece.", "safety": True, "phrase": "child almost choked", "signal_type": "choking", "severity": 4},
            {"week": 9, "count": 3, "rating": 1.0, "title": "Eye came detached", "body": "Dangerous loose button eye swallowed hazard for infants!", "safety": True, "phrase": "swallowed hazard", "signal_type": "choking", "severity": 3},
        ]
    },
    {
        "name": "SafetyFirst High Chair & Baby Carrier 3-in-1",
        "brand": "InfantGuard",
        "category": "Baby Products",
        "subcategory": "High Chairs",
        "description": "Convertible high chair and harness for feeding and travel.",
        "recall_hazard": "The harness buckle can fail and detach unexpectedly, posing a fall and injury hazard.",
        "recall_remedy": "Free replacement strap and reinforced buckle assembly.",
        "recall_week": 14,
        "start_date": "2024-01-01",
        "review_timeline": [
            {"week": 2, "count": 5, "rating": 5.0, "title": "Sturdy chair", "body": "Easy to clean and easy to assemble.", "safety": False},
            {"week": 5, "count": 3, "rating": 2.0, "title": "Strap unclasped", "body": "The safety strap snapped open once while feeding.", "safety": True, "phrase": "strap snapped", "signal_type": "fall", "severity": 2},
            {"week": 8, "count": 4, "rating": 1.0, "title": "Baby fell out!", "body": "The buckle failed completely and my child suffered a fall injury!", "safety": True, "phrase": "fall injury", "signal_type": "injury", "severity": 4},
        ]
    },
    {
        "name": "CozyHeat Oscillating Ceramic Tower Heater",
        "brand": "ThermalHome",
        "category": "Home Appliances",
        "subcategory": "Heaters",
        "description": "1500W indoor space heater with thermostat and remote control.",
        "recall_hazard": "Internal wiring can spark and short circuit, posing shock and electrical fire risk.",
        "recall_remedy": "Full product replacement or immediate store return credit.",
        "recall_week": 11,
        "start_date": "2024-01-01",
        "review_timeline": [
            {"week": 1, "count": 4, "rating": 5.0, "title": "Warms up fast", "body": "Heats the room quickly and quietly.", "safety": False},
            {"week": 4, "count": 3, "rating": 2.0, "title": "Sparking plug", "body": "Electric plug gave me a shock when plugging into the wall.", "safety": True, "phrase": "gave me a shock", "signal_type": "electric shock", "severity": 3},
            {"week": 7, "count": 5, "rating": 1.0, "title": "Sparks and smoke", "body": "Unit started sparking and cord melted onto hardwood floor!", "safety": True, "phrase": "cord melted", "signal_type": "melting", "severity": 4},
        ]
    }
]

CONTROL_PRODUCTS = [
    {
        "name": "UltraFit Noise-Canceling Wireless Earbuds",
        "brand": "AudioMax",
        "category": "Electronics",
        "subcategory": "Audio",
        "description": "Wireless bluetooth earbuds with active noise cancellation.",
        "reviews": [
            {"rating": 1.0, "title": "Terrible battery life", "body": "Battery dies in less than 1 hour. Horrible battery life!", "safety": False},
            {"rating": 2.0, "title": "Arrived late", "body": "Delivery was delayed by 4 days. Shipping was terrible.", "safety": False},
            {"rating": 1.0, "title": "Bad sound quality", "body": "Bass is weak and treble hurts my ears. Disappointed.", "safety": False},
            {"rating": 5.0, "title": "Great earbuds", "body": "Noise cancellation is amazing for flight travel.", "safety": False},
        ]
    },
    {
        "name": "Ergonomic Mesh Office Chair",
        "brand": "FlexiSit",
        "category": "Furniture",
        "subcategory": "Office Chairs",
        "description": "Breathable mesh office desk chair with lumbar support.",
        "reviews": [
            {"rating": 2.0, "title": "Uncomfortable cushion", "body": "Seat padding is too thin after 2 hours sitting.", "safety": False},
            {"rating": 1.0, "title": "Missing screws", "body": "Box arrived damaged with missing assembly screws.", "safety": False},
            {"rating": 4.0, "title": "Good lumbar support", "body": "Helps my back pain during long work hours.", "safety": False},
        ]
    }
]

def generate_synthetic_dataset() -> Dict[str, Any]:
    """Generates normalized products, reviews, safety reports, and recalls."""
    products = []
    reviews = []
    safety_reports = []
    recalls = []

    # Process Planted Defect Scenarios
    for scenario in PLANTED_SCENARIOS:
        start_dt = datetime.strptime(scenario["start_date"], "%Y-%m-%d")
        prod_id = f"prod-{scenario['name'].lower().replace(' ', '-')[:25]}"
        
        product_item = {
            "id": prod_id,
            "external_id": f"EXT-{random.randint(1000, 9999)}",
            "name": scenario["name"],
            "brand": scenario["brand"],
            "category": scenario["category"],
            "subcategory": scenario["subcategory"],
            "description": scenario["description"]
        }
        products.append(product_item)

        # Generate timeline reviews
        for item in scenario["review_timeline"]:
            review_dt = start_dt + timedelta(weeks=item["week"], days=random.randint(0, 4))
            for i in range(item["count"]):
                rev_id = f"rev-{len(reviews) + 1:05d}"
                is_safety = item.get("safety", False)
                phrase = item.get("phrase", "")
                sig_type = item.get("signal_type", "concern")
                sev = item.get("severity", 1)

                rev = {
                    "id": rev_id,
                    "product_id": prod_id,
                    "external_id": f"R-EXT-{len(reviews) + 1}",
                    "rating": item["rating"],
                    "title": item["title"],
                    "body": item["body"],
                    "review_date": review_dt,
                    "verified": True,
                    "source": "amazon",
                    "is_safety": is_safety,
                    "phrase": phrase,
                    "signal_type": sig_type,
                    "severity": sev
                }
                reviews.append(rev)

                # Generate matching SaferProducts report for severe signals
                if is_safety and sev >= 3 and random.random() > 0.4:
                    rep_id = f"rep-{len(safety_reports) + 1:05d}"
                    report = {
                        "id": rep_id,
                        "product_id": prod_id,
                        "external_id": f"CPSC-REP-{len(safety_reports) + 100}",
                        "report_date": review_dt + timedelta(days=1),
                        "description": f"Incident Report: {item['body']}",
                        "product_name": scenario["name"],
                        "category": scenario["category"],
                        "severity": sev,
                        "source": "saferproducts"
                    }
                    safety_reports.append(report)

        # Official Recall Record at recall_week
        recall_dt = start_dt + timedelta(weeks=scenario["recall_week"])
        recalls.append({
            "id": f"rec-{len(recalls) + 1:04d}",
            "external_id": f"CPSC-REC-{202400 + len(recalls)}",
            "product_id": prod_id,
            "recall_date": recall_dt,
            "announcement_date": recall_dt + timedelta(days=2),
            "description": f"Official CPSC Recall for {scenario['name']}",
            "hazard": scenario["recall_hazard"],
            "remedy": scenario["recall_remedy"],
            "category": scenario["category"],
            "source": "cpsc"
        })

    # Process Control Products
    for ctrl in CONTROL_PRODUCTS:
        start_dt = datetime(2024, 1, 1)
        prod_id = f"prod-{ctrl['name'].lower().replace(' ', '-')[:25]}"
        products.append({
            "id": prod_id,
            "external_id": f"EXT-{random.randint(1000, 9999)}",
            "name": ctrl["name"],
            "brand": ctrl["brand"],
            "category": ctrl["category"],
            "subcategory": ctrl["subcategory"],
            "description": ctrl["description"]
        })

        for i, rev_item in enumerate(ctrl["reviews"]):
            review_dt = start_dt + timedelta(weeks=i + 1, days=random.randint(0, 5))
            reviews.append({
                "id": f"rev-{len(reviews) + 1:05d}",
                "product_id": prod_id,
                "external_id": f"R-EXT-{len(reviews) + 1}",
                "rating": rev_item["rating"],
                "title": rev_item["title"],
                "body": rev_item["body"],
                "review_date": review_dt,
                "verified": True,
                "source": "amazon",
                "is_safety": False,
                "phrase": "",
                "signal_type": "none",
                "severity": 0
            })

    return {
        "products": products,
        "reviews": reviews,
        "safety_reports": safety_reports,
        "recalls": recalls
    }
