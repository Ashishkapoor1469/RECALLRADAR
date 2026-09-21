import sys
import os
import csv
from datetime import datetime

# Add root apps/api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.db.session import SessionLocal, engine
from app.db.init_db import init_db
from app.models import Product, Review, SafetyReport, Recall, SafetySignal
from data.synthetic.generator import generate_synthetic_dataset
from scripts.ingest_amazon_csv import ingest_csv

def seed_database():
    print("=== Seeding RecallRadar Database ===")
    init_db()

    csv_path = r"c:\Users\hp\Desktop\RecallRadar\Musical_instruments_reviews.csv\Musical_instruments_reviews.csv"
    
    db = SessionLocal()
    try:
        # Clear existing tables
        print("Clearing existing database records...")
        db.query(SafetySignal).delete()
        db.query(Recall).delete()
        db.query(SafetyReport).delete()
        db.query(Review).delete()
        db.query(Product).delete()
        db.commit()
        db.close()

        # Phase 1: Ingest primary real CSV dataset (Musical Instruments)
        if os.path.exists(csv_path):
            print(f"Ingesting real CSV dataset: {csv_path}")
            ingest_csv(csv_path)
        else:
            print(f"Warning: Real CSV file not found at {csv_path}")

        # Phase 2: Insert synthetic scenario fixtures for test suite compatibility
        db = SessionLocal()
        print("Inserting test scenario fixtures...")
        dataset = generate_synthetic_dataset()

        for p in dataset["products"]:
            # Only add synthetic products if not already present
            existing = db.query(Product).filter(Product.id == p["id"]).first()
            if not existing:
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

        for r in dataset["reviews"]:
            existing = db.query(Review).filter(Review.id == r["id"]).first()
            if not existing:
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

        for rep in dataset["safety_reports"]:
            existing = db.query(SafetyReport).filter(SafetyReport.id == rep["id"]).first()
            if not existing:
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

        for rec in dataset["recalls"]:
            existing = db.query(Recall).filter(Recall.id == rec["id"]).first()
            if not existing:
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

        total_p = db.query(Product).count()
        total_r = db.query(Review).count()
        total_s = db.query(SafetySignal).count()
        print(f"\n=== Database Seeding Complete ===")
        print(f"Total Products: {total_p}")
        print(f"Total Reviews: {total_r}")
        print(f"Total Safety Signals: {total_s}")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
