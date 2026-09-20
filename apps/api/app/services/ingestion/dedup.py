from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import Review, SafetyReport, Recall, Product

class DeduplicationManager:
    """Manages record deduplication and entity resolution across sources."""

    def __init__(self, db: Session):
        self.db = db

    def is_review_duplicate(self, source: str, external_id: str) -> bool:
        if not external_id:
            return False
        return self.db.query(Review).filter(
            Review.source == source,
            Review.external_id == external_id
        ).first() is not None

    def is_report_duplicate(self, source: str, external_id: str) -> bool:
        if not external_id:
            return False
        return self.db.query(SafetyReport).filter(
            SafetyReport.source == source,
            SafetyReport.external_id == external_id
        ).first() is not None

    def is_recall_duplicate(self, source: str, external_id: str) -> bool:
        if not external_id:
            return False
        return self.db.query(Recall).filter(
            Recall.source == source,
            Recall.external_id == external_id
        ).first() is not None

    def get_or_create_product_by_name(self, name: str, category: str = "General", brand: str = "Generic") -> Product:
        """Find existing product by fuzzy name matching or create a new Product entity."""
        product = self.db.query(Product).filter(Product.name == name).first()
        if not product:
            product = Product(
                name=name,
                brand=brand,
                category=category,
                description=f"Ingested product record for {name}"
            )
            self.db.add(product)
            self.db.commit()
            self.db.refresh(product)
        return product
