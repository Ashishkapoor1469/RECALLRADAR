import sys
import os

# Add root and api directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from app.db.session import SessionLocal
from app.models import Product, Review, SafetySignal, SafetyReport, Recall

SYNTHETIC_BRANDS = ["VoltTech", "CuddleBuddies", "InfantGuard", "ThermalHome", "AudioMax", "FlexiSit"]

def remove_synthetic_data():
    db = SessionLocal()
    try:
        synthetic_products = db.query(Product).filter(
            (Product.brand.in_(SYNTHETIC_BRANDS)) | (Product.external_id.like("prod-%"))
        ).all()
        
        syn_ids = [p.id for p in synthetic_products]
        print(f"Found {len(syn_ids)} synthetic demo products to remove.")

        if syn_ids:
            # Delete signals, reviews, reports, recalls linked to synthetic products
            db.query(SafetySignal).filter(SafetySignal.product_id.in_(syn_ids)).delete(synchronize_session=False)
            db.query(Recall).filter(Recall.product_id.in_(syn_ids)).delete(synchronize_session=False)
            db.query(SafetyReport).filter(SafetyReport.product_id.in_(syn_ids)).delete(synchronize_session=False)
            db.query(Review).filter(Review.product_id.in_(syn_ids)).delete(synchronize_session=False)
            db.query(Product).filter(Product.id.in_(syn_ids)).delete(synchronize_session=False)
            
            db.commit()
            print("Successfully deleted synthetic demo data.")
        else:
            print("No synthetic products found in database.")

        # Print current clean counts
        p_count = db.query(Product).count()
        r_count = db.query(Review).count()
        s_count = db.query(SafetySignal).count()
        print(f"\n--- Clean DB State ---")
        print(f"Products: {p_count}")
        print(f"Reviews: {r_count}")
        print(f"Safety Signals: {s_count}")

    except Exception as e:
        db.rollback()
        print(f"Error removing synthetic data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    remove_synthetic_data()
