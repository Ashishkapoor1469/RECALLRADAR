import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.models import (
    Product, Review, ImprovementSignal, ImprovementProductMetric
)
from app.ml.detection.improvement_detector import ImprovementDetector
from app.ml.clustering.improvement_clusterer import ImprovementClusterer


class ImprovementService:
    def __init__(self, db: Session):
        self.db = db
        self.detector = ImprovementDetector()
        self.clusterer = ImprovementClusterer()

    def sync_improvement_signals(self, batch_size: int = 2000) -> Dict[str, Any]:
        """
        Scans reviews in the database to detect improvement suggestions,
        stores them in improvement_signals, and computes clustered Improvement Index
        for each product.
        """
        # Check existing improvement signals count
        existing_signals_count = self.db.query(ImprovementSignal).count()
        if existing_signals_count == 0:
            # First-time population
            reviews = self.db.query(Review).all()
            new_signals = []

            for rev in reviews:
                full_text = f"{rev.title or ''}. {rev.body or ''}"
                detections = self.detector.detect(full_text, rating=rev.rating)
                for det in detections:
                    sig = ImprovementSignal(
                        id=str(uuid.uuid4()),
                        review_id=rev.id,
                        product_id=rev.product_id,
                        suggestion_text=det["suggestion_text"],
                        category=det["category"],
                        cluster_label=det["cluster_label"],
                        confidence=det["confidence"],
                        created_at=rev.review_date or datetime.utcnow()
                    )
                    new_signals.append(sig)

            if new_signals:
                self.db.bulk_save_objects(new_signals)
                self.db.commit()

        # Recalculate metrics for all products that have signals
        all_signals = self.db.query(ImprovementSignal).all()
        signals_by_product = {}
        for s in all_signals:
            signals_by_product.setdefault(s.product_id, []).append(s)

        # Pre-fetch review details for sample excerpts
        sig_rev_ids = list(set([s.review_id for s in all_signals]))
        reviews_map = {}
        if sig_rev_ids:
            rev_rows = self.db.query(Review).filter(Review.id.in_(sig_rev_ids)).all()
            reviews_map = {r.id: r for r in rev_rows}

        # Pre-fetch existing metrics to avoid N+1 queries
        existing_metrics = {m.product_id: m for m in self.db.query(ImprovementProductMetric).all()}

        products_updated = 0
        for prod_id, p_signals in signals_by_product.items():
            formatted_signals = []
            for s in p_signals:
                rev = reviews_map.get(s.review_id)
                body_excerpt = rev.body if rev else s.suggestion_text
                formatted_signals.append({
                    "cluster_label": s.cluster_label,
                    "category": s.category,
                    "review_id": s.review_id,
                    "suggestion_text": s.suggestion_text,
                    "full_review_excerpt": body_excerpt
                })

            clusters = self.clusterer.cluster_suggestions(formatted_signals)
            distinct_reviews = len(set([s.review_id for s in p_signals]))
            improvement_idx = self.clusterer.calculate_improvement_index(clusters, distinct_reviews)

            top_cluster_name = clusters[0]["cluster_label"] if clusters else "General Refinements"

            metric = existing_metrics.get(prod_id)

            if not metric:
                metric = ImprovementProductMetric(
                    id=str(uuid.uuid4()),
                    product_id=prod_id,
                    improvement_index=improvement_idx,
                    review_count=distinct_reviews,
                    cluster_count=len(clusters),
                    top_cluster=top_cluster_name,
                    top_clusters=clusters,
                    updated_at=datetime.utcnow()
                )
                self.db.add(metric)
            else:
                metric.improvement_index = improvement_idx
                metric.review_count = distinct_reviews
                metric.cluster_count = len(clusters)
                metric.top_cluster = top_cluster_name
                metric.top_clusters = clusters
                metric.updated_at = datetime.utcnow()

            products_updated += 1

        self.db.commit()
        return {
            "total_signals": len(all_signals),
            "products_updated": products_updated
        }

    def get_improvement_products(
        self,
        sort_by: str = "index",
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Returns list of products having at least one improvement suggestion review,
        sorted by improvement_index or review_count.
        """
        # Ensure signals are synced if table is empty
        if self.db.query(ImprovementProductMetric).count() == 0:
            self.sync_improvement_signals()

        query = self.db.query(ImprovementProductMetric, Product).join(
            Product, ImprovementProductMetric.product_id == Product.id
        ).filter(ImprovementProductMetric.review_count > 0)

        if sort_by == "count":
            query = query.order_by(
                desc(ImprovementProductMetric.review_count),
                desc(ImprovementProductMetric.improvement_index)
            )
        else:
            query = query.order_by(
                desc(ImprovementProductMetric.improvement_index),
                desc(ImprovementProductMetric.review_count)
            )

        total = query.count()
        offset = (page - 1) * page_size
        results = query.offset(offset).limit(page_size).all()

        items = []
        for metric, prod in results:
            items.append({
                "id": prod.id,
                "asin": prod.external_id or prod.id,
                "name": prod.name,
                "brand": prod.brand or "Brand Audio / Gear",
                "category": prod.category or "Musical Instruments",
                "improvement_index": metric.improvement_index,
                "improvement_score": metric.improvement_index,
                "review_count": metric.review_count,
                "cluster_count": metric.cluster_count,
                "top_cluster": metric.top_cluster,
                "top_clusters": metric.top_clusters or [],
                "updated_at": metric.updated_at.strftime("%Y-%m-%d") if metric.updated_at else None
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "sort_by": sort_by
        }

    def get_product_detail(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves complete improvement suggestions & cluster breakdown for a single product,
        including review-level evidence and citations.
        """
        # Find product
        prod = self.db.query(Product).filter(
            (Product.id == product_id) | (Product.external_id == product_id)
        ).first()

        if not prod:
            return None

        metric = self.db.query(ImprovementProductMetric).filter(
            ImprovementProductMetric.product_id == prod.id
        ).first()

        signals = self.db.query(ImprovementSignal).filter(
            ImprovementSignal.product_id == prod.id
        ).order_by(desc(ImprovementSignal.created_at)).all()

        sig_rev_ids = [s.review_id for s in signals]
        reviews_map = {}
        if sig_rev_ids:
            rev_rows = self.db.query(Review).filter(Review.id.in_(sig_rev_ids)).all()
            reviews_map = {r.id: r for r in rev_rows}

        # Group reviews into clusters with evidence
        clusters_dict = {}
        for s in signals:
            cluster_name = s.cluster_label
            if cluster_name not in clusters_dict:
                clusters_dict[cluster_name] = {
                    "cluster_label": cluster_name,
                    "category": s.category,
                    "count": 0,
                    "evidence": []
                }

            rev = reviews_map.get(s.review_id)
            clusters_dict[cluster_name]["count"] += 1
            clusters_dict[cluster_name]["evidence"].append({
                "signal_id": s.id,
                "review_id": s.review_id,
                "suggestion_text": s.suggestion_text,
                "full_review": rev.body if rev else s.suggestion_text,
                "rating": rev.rating if rev else None,
                "review_date": rev.review_date.strftime("%Y-%m-%d") if rev and rev.review_date else None,
                "confidence": s.confidence
            })

        clusters_list = sorted(clusters_dict.values(), key=lambda x: x["count"], reverse=True)

        return {
            "product": {
                "id": prod.id,
                "asin": prod.external_id or prod.id,
                "name": prod.name,
                "brand": prod.brand or "Brand Audio / Gear",
                "category": prod.category or "Musical Instruments",
                "description": prod.description
            },
            "metric": {
                "improvement_index": metric.improvement_index if metric else 0.0,
                "improvement_score": metric.improvement_index if metric else 0.0,
                "review_count": metric.review_count if metric else len(signals),
                "cluster_count": metric.cluster_count if metric else len(clusters_list),
                "top_cluster": metric.top_cluster if metric else (clusters_list[0]["cluster_label"] if clusters_list else "None")
            },
            "clusters": clusters_list
        }

    def get_summary_stats(self) -> Dict[str, Any]:
        """Summary stats for Improvement Insights."""
        metrics = self.db.query(ImprovementProductMetric).all()
        total_products = len(metrics)
        total_reviews = sum(m.review_count for m in metrics)
        avg_index = round(sum(m.improvement_index for m in metrics) / total_products, 1) if total_products > 0 else 0.0

        # Find top requested cluster overall
        cluster_counts = {}
        for m in metrics:
            if m.top_clusters:
                for c in m.top_clusters:
                    lbl = c.get("cluster_label", "Other")
                    cluster_counts[lbl] = cluster_counts.get(lbl, 0) + c.get("count", 0)

        top_cluster = max(cluster_counts.items(), key=lambda x: x[1])[0] if cluster_counts else "Extend Cable / Wire Length"

        return {
            "total_products_with_suggestions": total_products,
            "total_improvement_reviews": total_reviews,
            "average_improvement_index": avg_index,
            "top_requested_cluster": top_cluster,
            "cluster_breakdown": [{"cluster": k, "count": v} for k, v in sorted(cluster_counts.items(), key=lambda x: x[1], reverse=True)[:6]]
        }
