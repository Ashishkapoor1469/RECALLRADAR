import os
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.db.session import SessionLocal
from app.models.models import Product, Review, ImprovementSignal
from app.services.improvement_service import ImprovementService
from app.services.cache_service import CacheService

# Curated constructive suggestions across different domains
CONSTRUCTIVE_REVIEWS = [
    {
        "search_asin": "B000068NW5", # Or first product
        "rating": 4.0,
        "title": "Great sound quality, but wire is too short",
        "body": "The headphones are really good and audio clarity is top notch, but the cable is too short. Please make it longer, at least 6 feet, so I don't feel tethered to my desk!",
        "author": "Marcus V. (Verified Studio Tech)"
    },
    {
        "search_asin": "B000068NW5",
        "rating": 4.0,
        "title": "Solid build, wish it came with USB-C",
        "body": "Works fine overall and battery life is decent, however wish it had USB-C fast charging instead of the older micro-USB plug. Would be much better if it included a braided cord.",
        "author": "Priya D. (Audio Engineer)"
    },
    {
        "search_asin": "B0002CZV82",
        "rating": 4.0,
        "title": "Love the ergonomics, could use better padding",
        "body": "I love the acoustic response of this instrument, but after 2 hours of playing it starts hurting. Needs a little softer padding on the shoulder rest and a smoother adjustment latch.",
        "author": "Daniel K. (Classical Performer)"
    },
    {
        "search_asin": "B0002CZV82",
        "rating": 3.0,
        "title": "Good tone, minor gripe with volume potentiometer",
        "body": "Sound is excellent, only drawback is the volume dial feels a bit stiff. Suggest adding tactile notches or a smoother taper so stage adjustments are easier in the dark.",
        "author": "Elena R. (Touring Musician)"
    },
    {
        "search_asin": "B000068NW5",
        "rating": 4.0,
        "title": "Reliable adapter, would prefer an LED indicator",
        "body": "Decent power delivery and stays cool under normal load, but if only there were a small status LED light to show when power is connected. Please add an LED in the next revision.",
        "author": "Greg S. (Hardware QA)"
    },
    {
        "search_asin": "B0002CZV82",
        "rating": 4.0,
        "title": "Sturdy chassis, needs a hardshell travel case",
        "body": "The unit itself is very solid. My only complaint is the included gig bag is too flimsy. Would be perfect if it came with a molded hardshell case for travel protection.",
        "author": "Chloe M. (Session Bassist)"
    }
]

def seed_improvement_reviews():
    print("=== Seeding Constructive Reviews & Improvement Insights ===")
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        if not products:
            print("No products found in database!")
            return

        prod_by_asin = {p.external_id or p.id: p for p in products}
        fallback_prod = products[0]

        service = ImprovementService(db)
        seeded_count = 0

        for r_data in CONSTRUCTIVE_REVIEWS:
            prod = prod_by_asin.get(r_data["search_asin"], fallback_prod)
            
            review_id = str(uuid.uuid4())
            now = datetime.utcnow() - timedelta(days=seeded_count * 2)

            rev = Review(
                id=review_id,
                product_id=prod.id,
                external_id=f"REV-IMP-{uuid.uuid4().hex[:6].upper()}",
                rating=r_data["rating"],
                title=r_data["title"],
                body=r_data["body"],
                review_date=now,
                verified=True,
                source="Customer Feedback Portal",
                created_at=now
            )
            db.add(rev)
            db.flush()

            # Run detection on review text
            full_text = f"{r_data['title']}. {r_data['body']}"
            detections = service.detector.detect(full_text, rating=r_data["rating"])
            print(f"\n[Review #{seeded_count+1}] '{r_data['title']}' for '{prod.name[:35]}...'")
            print(f"  -> Detections found: {len(detections)}")

            for det in detections:
                sig = ImprovementSignal(
                    id=str(uuid.uuid4()),
                    review_id=review_id,
                    product_id=prod.id,
                    suggestion_text=det["suggestion_text"],
                    category=det["category"],
                    cluster_label=det["cluster_label"],
                    confidence=det["confidence"],
                    created_at=now
                )
                db.add(sig)
                print(f"     * Category: {det['category']} | Cluster: '{det['cluster_label']}' | Conf: {det['confidence']}")

            seeded_count += 1

        db.commit()
        print(f"\n[OK] Successfully persisted {seeded_count} constructive reviews into database.")

        # Re-sync clustering and metrics
        print("Re-clustering improvement signals & computing Improvement Index...")
        sync_result = service.sync_improvement_signals()
        print(f"Sync complete: {sync_result}")

        # Invalidate cache so endpoints immediately return fresh numbers
        CacheService.invalidate("cache:improvement")
        CacheService.invalidate("cache:overview")
        print("[OK] Caches invalidated. Fresh suggestions are now live!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_improvement_reviews()
