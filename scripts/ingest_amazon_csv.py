import sys
import os
import csv
from datetime import datetime
from typing import Dict

# Add root and api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

import uuid
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models import Product, Review, SafetySignal, ReviewSignal
from app.ml.detection.detector import SafetySignalDetector
from app.ml.detection.lexicon import classify_review_signals

def generate_uuid():
    return str(uuid.uuid4())

def ingest_csv(csv_path: str, limit: int = None):
    print(f"=== Starting Ingestion for {csv_path} ===")
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return

    # Initialize tables
    init_db()
    db = SessionLocal()
    detector = SafetySignalDetector()

    products_map: Dict[str, str] = {} # asin -> product_id
    total_reviews = 0
    total_signals = 0
    total_review_signals = 0
    total_products = 0

    try:
        with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            
            print("Processing CSV rows and creating products, reviews, safety & review signals...")

            for i, row in enumerate(reader):
                if limit and i >= limit:
                    break
                
                asin = row.get("asin", "").strip()
                if not asin:
                    continue

                # Ensure product exists
                if asin not in products_map:
                    # Check DB first
                    existing = db.query(Product).filter(Product.external_id == asin).first()
                    if existing:
                        products_map[asin] = existing.id
                    else:
                        p_id = generate_uuid()
                        product = Product(
                            id=p_id,
                            external_id=asin,
                            name=f"Musical Instrument (ASIN: {asin})",
                            brand="Amazon Seller",
                            category="Musical Instruments",
                            subcategory="Accessories & Gear",
                            description=f"Musical instrument equipment, accessories, and audio gear with ASIN {asin}."
                        )
                        db.add(product)
                        db.flush()
                        products_map[asin] = p_id
                        total_products += 1
                
                prod_id = products_map[asin]

                # Parse timestamp
                unix_time = row.get("unixReviewTime")
                if unix_time and unix_time.isdigit():
                    review_dt = datetime.utcfromtimestamp(int(unix_time))
                else:
                    review_dt = datetime.utcnow()

                review_id = generate_uuid()
                summary = row.get("summary", "") or ""
                review_text = row.get("reviewText", "") or ""
                rating = float(row.get("overall", 5.0))

                review = Review(
                    id=review_id,
                    product_id=prod_id,
                    external_id=row.get("reviewerID"),
                    rating=rating,
                    title=summary,
                    body=review_text,
                    review_date=review_dt,
                    verified=True,
                    source="amazon"
                )
                db.add(review)
                db.flush()
                total_reviews += 1

                # Safety Signal Detection
                full_text = f"{summary}. {review_text}"
                detections = detector.detect(full_text)
                for d in detections:
                    signal = SafetySignal(
                        id=generate_uuid(),
                        product_id=prod_id,
                        review_id=review_id,
                        signal_type=d["signal_type"],
                        phrase=d["phrase"],
                        severity=d["severity"],
                        confidence=d["confidence"],
                        detected_at=review_dt
                    )
                    db.add(signal)
                    total_signals += 1

                # Lexicon Review Signals Classification
                rev_signals = classify_review_signals(full_text)
                for rs in rev_signals:
                    rs_entry = ReviewSignal(
                        id=generate_uuid(),
                        review_id=review_id,
                        product_id=prod_id,
                        category=rs["category"],
                        sentiment="negative" if rating <= 3.0 else "positive",
                        keyword=rs["keyword"],
                        created_at=review_dt
                    )
                    db.add(rs_entry)
                    total_review_signals += 1

                # Batch commit every 1000 items
                if total_reviews % 1000 == 0:
                    db.commit()
                    print(f"Processed {total_reviews} reviews...")

            db.commit()
            print("\n=== Ingestion Completed Successfully ===")
            print(f"Total Products Inserted: {total_products}")
            print(f"Total Reviews Ingested: {total_reviews}")
            print(f"Total Safety Signals Flagged & Linked: {total_signals}")

    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    csv_file = r"c:\Users\hp\Desktop\RecallRadar\Musical_instruments_reviews.csv\Musical_instruments_reviews.csv"
    ingest_csv(csv_file)
