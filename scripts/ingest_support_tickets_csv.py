import sys
import os
import csv
import argparse
from datetime import datetime

# Add root and api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

import uuid
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.models import Product, Review, SafetySignal, ReviewSignal
from app.services.ingestion.adapters import SupportTicketsAdapter
from app.services.ingestion.dedup import DeduplicationManager
from app.ml.detection.detector import SafetySignalDetector
from app.ml.detection.lexicon import classify_review_signals

def generate_uuid():
    return str(uuid.uuid4())

def ensure_sample_csv(csv_path: str):
    if not os.path.exists(csv_path):
        os.makedirs(os.path.dirname(os.path.abspath(csv_path)), exist_ok=True)
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["ticket_id", "product", "product_id", "text", "rating", "title", "created_at"])
            writer.writerow(["TCK-1001", "Demo Smart Charger Pro 65W", "EXT-4382", "The charger started smoking and smelled like burning plastic after 15 minutes of use.", "1.0", "Overheating and Smoke Hazard", "2026-03-20"])
            writer.writerow(["TCK-1002", "Pro Audio Studio Headphone Cable", "EXT-9102", "Cable detachment caused loud sparking noise when plugged into amplifier.", "2.0", "Sparking Cable Detachment", "2026-03-21"])
            writer.writerow(["TCK-1003", "Ergonomic Acoustic Guitar Strap", "EXT-5521", "The strap buckle snapped while on stage and guitar fell out onto floor.", "2.0", "Strap Buckle Failure", "2026-03-22"])
            writer.writerow(["TCK-1004", "Solid Wood Ukulele Concert Size", "EXT-1104", "Great finish, sounds lovely and tuned easily.", "5.0", "Praise Support Message", "2026-03-23"])
        print(f"Created sample support tickets CSV at: {csv_path}")

def ingest_support_tickets_csv(csv_path: str, limit: int = None):
    print(f"=== Starting Support Tickets Ingestion for {csv_path} ===")
    ensure_sample_csv(csv_path)

    init_db()
    db = SessionLocal()
    adapter = SupportTicketsAdapter()
    dedup = DeduplicationManager(db)
    detector = SafetySignalDetector()

    total_tickets = 0
    total_signals = 0
    total_duplicates = 0

    try:
        with open(csv_path, mode="r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            
            for i, row in enumerate(reader):
                if limit and i >= limit:
                    break

                if not adapter.validate(row):
                    continue

                norm = adapter.normalize(row)
                ext_id = norm["external_id"]

                # 1. Deduplication check via DeduplicationManager
                if dedup.is_review_duplicate(source="support_ticket", external_id=ext_id):
                    total_duplicates += 1
                    continue

                # 2. Entity resolution / get or create Product
                prod_name = norm["product_name"]
                prod_ext = norm["product_external_id"]
                product = db.query(Product).filter(
                    (Product.external_id == prod_ext) | (Product.name == prod_name)
                ).first()

                if not product:
                    product = dedup.get_or_create_product_by_name(
                        name=prod_name,
                        category="Customer Support Ingested",
                        brand="Support Stream"
                    )
                    product.external_id = prod_ext
                    db.flush()

                # 3. Create Review / Ticket record
                rev_id = generate_uuid()
                review = Review(
                    id=rev_id,
                    product_id=product.id,
                    external_id=ext_id,
                    rating=norm["rating"],
                    title=norm["title"],
                    body=norm["body"],
                    review_date=norm["review_date"],
                    verified=norm["verified"],
                    source="support_ticket"
                )
                db.add(review)
                db.flush()
                total_tickets += 1

                # 4. Route through existing detection pipeline
                detected = detector.detect(norm["body"], rating=norm["rating"])
                for sig in detected:
                    signal = SafetySignal(
                        id=generate_uuid(),
                        product_id=product.id,
                        review_id=rev_id,
                        signal_type=sig["signal_type"],
                        phrase=sig["phrase"],
                        severity=sig["severity"],
                        confidence=sig["confidence"],
                        detected_at=norm["review_date"]
                    )
                    db.add(signal)
                    total_signals += 1

                review_sigs = classify_review_signals(norm["body"], rating=norm["rating"])
                for rs in review_sigs:
                    rev_sig = ReviewSignal(
                        id=generate_uuid(),
                        review_id=rev_id,
                        product_id=product.id,
                        signal_type=rs.signal_type,
                        phrase=rs.phrase,
                        sentiment=rs.sentiment,
                        severity=rs.severity,
                        created_at=norm["review_date"]
                    )
                    db.add(rev_sig)

        db.commit()
        print(f"=== Support Tickets Ingestion Complete ===")
        print(f"Ingested: {total_tickets} tickets | Detected: {total_signals} safety signals | Duplicates Skipped: {total_duplicates}")

    except Exception as e:
        db.rollback()
        print(f"Ingestion failed with error: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest customer support tickets CSV into EarlyEcho.")
    parser.add_argument("--file", default=os.path.join(os.path.dirname(__file__), "..", "data", "sample_support_tickets.csv"), help="Path to support tickets CSV")
    parser.add_argument("--limit", type=int, default=None, help="Max rows to process")
    args = parser.parse_args()
    ingest_support_tickets_csv(args.file, args.limit)
