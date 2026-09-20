import sys
import os
from datetime import datetime

# Add root apps/api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from app.models import Product, Review, SafetyReport, Recall, SafetySignal
from data.synthetic.generator import generate_synthetic_dataset

def seed_database():
    print("Initializing database tables...")
    init_db()

    db = SessionLocal()
    try:
        print("Generating synthetic dataset...")
        dataset = generate_synthetic_dataset()

        # Clean existing records
        print("Clearing existing database records...")
        db.query(SafetySignal).delete()
        db.query(Recall).delete()
        db.query(SafetyReport).delete()
        db.query(Review).delete()
        db.query(Product).delete()
        db.commit()

        # Insert products
        print(f"Inserting {len(dataset['products'])} products...")
        for p in dataset["products"]:
            product = Product(
                id=p["id"],
                external_id=p["external_id"],
                name=p["name"],
                brand=p["brand"],
                category=p["category"],
                subcategory=p["subcategory"],
                description=p["description"]
            )
            db.add(product)
        db.commit()

        # Insert reviews
        print(f"Inserting {len(dataset['reviews'])} reviews...")
        for r in dataset["reviews"]:
            review = Review(
                id=r["id"],
                product_id=r["product_id"],
                external_id=r["external_id"],
                rating=r["rating"],
                title=r["title"],
                body=r["body"],
                review_date=r["review_date"],
                verified=r["verified"],
                source=r["source"]
            )
            db.add(review)

            # Insert explicit signal if flagged in synthetic data
            if r.get("is_safety"):
                signal = SafetySignal(
                    product_id=r["product_id"],
                    review_id=r["id"],
                    signal_type=r["signal_type"],
                    phrase=r["phrase"],
                    severity=r["severity"],
                    confidence=0.95,
                    detected_at=r["review_date"]
                )
                db.add(signal)
        db.commit()

        # Insert safety reports
        print(f"Inserting {len(dataset['safety_reports'])} safety reports...")
        for rep in dataset["safety_reports"]:
            report = SafetyReport(
                id=rep["id"],
                product_id=rep["product_id"],
                external_id=rep["external_id"],
                report_date=rep["report_date"],
                description=rep["description"],
                product_name=rep["product_name"],
                category=rep["category"],
                severity=rep["severity"],
                source=rep["source"]
            )
            db.add(report)
        db.commit()

        # Insert recalls
        print(f"Inserting {len(dataset['recalls'])} recalls...")
        for rec in dataset["recalls"]:
            recall = Recall(
                id=rec["id"],
                external_id=rec["external_id"],
                product_id=rec["product_id"],
                recall_date=rec["recall_date"],
                announcement_date=rec["announcement_date"],
                description=rec["description"],
                hazard=rec["hazard"],
                remedy=rec["remedy"],
                category=rec["category"],
                source=rec["source"]
            )
            db.add(recall)
        db.commit()

        print("Database seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
