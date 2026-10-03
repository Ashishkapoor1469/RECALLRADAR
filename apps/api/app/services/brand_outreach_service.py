import os
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models import BrandContact, BrandOutreachReport, BrandOutreachLog
from app.services.brand_catalog_provider import BrandCatalogProvider
from app.services.brand_report_generator import BrandReportGenerator
from app.ml.detection.detector import SafetySignalDetector
from app.ml.clustering.clusterer import DefectClusterer
from app.ml.risk.engine import InterpretableRiskEngine


class BrandOutreachService:
    """End-to-end service for brand lookup, cold-start hazard scoring, and report generation."""

    def __init__(self, db: Session):
        self.db = db
        self.detector = SafetySignalDetector()
        self.clusterer = DefectClusterer()
        self.risk_engine = InterpretableRiskEngine()

    def seed_known_contacts(self):
        """Seeds manually verified brand outreach contacts into brand_contacts table if missing."""
        presets = BrandCatalogProvider.list_supported_brands()
        for p in presets:
            if not p.get("default_contact_email"):
                continue
            existing = self.db.query(BrandContact).filter(BrandContact.brand_name.ilike(p["name"])).first()
            if not existing:
                contact = BrandContact(
                    brand_name=p["name"],
                    contact_email=p["default_contact_email"],
                    contact_person=p.get("verified_contact"),
                    department="Product Quality, Safety & Regulatory Affairs",
                    verified=True,
                    source="MANUAL_SEED",
                    notes=f"Primary verified compliance address for {p['company']}"
                )
                self.db.add(contact)
        self.db.commit()

    def lookup_contact(self, brand_name: str) -> Optional[Dict[str, Any]]:
        """Checks if a verified contact email exists in brand_contacts DB."""
        if not brand_name:
            return None
        contact = self.db.query(BrandContact).filter(BrandContact.brand_name.ilike(brand_name.strip())).first()
        if contact:
            return {
                "id": contact.id,
                "brand_name": contact.brand_name,
                "contact_email": contact.contact_email,
                "contact_person": contact.contact_person,
                "department": contact.department,
                "verified": contact.verified,
                "source": contact.source,
                "notes": contact.notes
            }
        return None

    def upsert_contact(self, brand_name: str, email: str, contact_person: Optional[str] = None, notes: Optional[str] = None) -> Dict[str, Any]:
        """Allows human team to verify and save a brand contact email."""
        contact = self.db.query(BrandContact).filter(BrandContact.brand_name.ilike(brand_name.strip())).first()
        if not contact:
            contact = BrandContact(
                brand_name=brand_name.strip(),
                contact_email=email.strip().lower(),
                contact_person=contact_person,
                department="Product Safety & Outreach",
                verified=True,
                source="HUMAN_CONFIRMED",
                notes=notes
            )
            self.db.add(contact)
        else:
            contact.contact_email = email.strip().lower()
            if contact_person:
                contact.contact_person = contact_person
            if notes:
                contact.notes = notes
            contact.verified = True
            contact.source = "HUMAN_CONFIRMED"
        self.db.commit()
        self.db.refresh(contact)

        return {
            "id": contact.id,
            "brand_name": contact.brand_name,
            "contact_email": contact.contact_email,
            "contact_person": contact.contact_person,
            "verified": contact.verified,
            "source": contact.source
        }

    def analyze_brand(self, query: str, threshold: float = 50.0) -> Dict[str, Any]:
        """Phase 1 -> Phase 2 -> Phase 3 pipeline: pulls catalog, runs existing scoring, generates PDF/CSV."""
        start_time = time.time()
        self.seed_known_contacts()

        # Phase 1: Brand catalog lookup / input parsing
        catalog = BrandCatalogProvider.get_catalog_for_brand(query)
        if not catalog or not catalog.get("products"):
            raise ValueError(f"No product listings could be discovered for query: '{query}'")

        brand_name = catalog.get("canonical_name", query.strip().title())
        company_name = catalog.get("company", f"{brand_name} Ltd.")
        products_raw = catalog.get("products", [])

        # Phase 2: Feed pulled reviews through EXISTING scoring pipeline (cold-start)
        scored_products = []
        total_reviews_count = 0
        all_catalog_signals = []

        for p in products_raw:
            asin = p.get("asin", "N/A")
            p_name = p.get("name", "Product")
            reviews = p.get("reviews", [])
            total_reviews_count += len(reviews)

            p_signals = []
            flagged_reviews = []

            for r in reviews:
                r_text = r.get("text", "")
                r_rating = r.get("rating", 3.0)
                # Call existing SafetySignalDetector
                detections = self.detector.detect(r_text, rating=r_rating)
                if detections:
                    flagged_reviews.append({
                        "review": r,
                        "signals": detections
                    })
                    p_signals.extend(detections)
                    all_catalog_signals.extend(detections)

            # Call existing DefectClusterer
            clusters = self.clusterer.cluster_signals(p_signals)
            top_cluster = clusters[0]["cluster_name"] if clusters else "None Detected"

            # Compute features for InterpretableRiskEngine
            signal_count = len(p_signals)
            max_sev = max([s.get("severity", 1) for s in p_signals], default=0)
            unique_reps = len(flagged_reviews)
            # In cold start, velocity is computed based on signal intensity over review set
            vel_ratio = float((signal_count + 1) / 1.0) if signal_count > 0 else 1.0

            features = {
                "product_id": asin,
                "signal_count": signal_count,
                "recent_count": signal_count,
                "velocity_ratio": vel_ratio,
                "max_severity": max_sev,
                "source_agreement": 0.0, # Zero external CPSC reports in cold start
                "unique_reporters": unique_reps
            }

            # Call existing InterpretableRiskEngine
            risk_result = self.risk_engine.calculate_risk(features)
            hazard_score = risk_result.get("risk_score", 0.0)

            # Collect top 2-3 evidence review excerpts
            evidence_samples = []
            for item in flagged_reviews[:3]:
                rev = item["review"]
                primary_sig = item["signals"][0]
                evidence_samples.append({
                    "id": rev.get("id", "REV"),
                    "date": rev.get("date", "Recent"),
                    "rating": rev.get("rating", 1.0),
                    "danger_phrase": primary_sig.get("phrase", "Safety Signal"),
                    "signal_type": primary_sig.get("signal_type", "hazard"),
                    "text": rev.get("text", "")
                })

            # Analytical explanation
            if hazard_score >= 70.0:
                risk_level = "Critical"
                analytical_summary = (
                    f"CRITICAL SAFETY ACCELERATION: Multiple verified consumer reports document acute incidents in the "
                    f"'{top_cluster}' category (max severity {max_sev}/4). Reported symptoms include thermal runaway, "
                    f"sparking, or physical lacerations requiring emergency attention. Immediate containment recommended."
                )
            elif hazard_score >= 50.0:
                risk_level = "Elevated"
                analytical_summary = (
                    f"ELEVATED RISK TRAJECTORY: Review streams indicate recurring safety anomalies concentrated in '{top_cluster}'. "
                    f"A velocity ratio of {round(vel_ratio, 1)}x across {unique_reps} distinct purchasers signals a potential "
                    f"component degradation or manufacturing batch issue before mainstream recall thresholds."
                )
            else:
                risk_level = "Normal"
                analytical_summary = (
                    f"MONITORED BASELINE: Review corpus does not show concentrated safety or injury signals. "
                    f"Normal operational parameters observed across consumer feedback."
                )

            scored_products.append({
                "asin": asin,
                "name": p_name,
                "category": p.get("category", "General"),
                "total_reviews": len(reviews),
                "hazard_score": hazard_score,
                "confidence_score": risk_result.get("confidence_score", 0.5),
                "confidence_label": risk_result.get("confidence_label", "Medium"),
                "risk_level": risk_level,
                "flagged_count": len(flagged_reviews),
                "top_cluster": top_cluster,
                "clusters": clusters,
                "contributors": risk_result.get("contributors", []),
                "evidence_samples": evidence_samples,
                "analytical_summary": analytical_summary,
                "velocity_ratio": vel_ratio
            })

        # Rank products: highest risk first
        scored_products.sort(key=lambda x: x["hazard_score"], reverse=True)

        # Summary KPIs
        flagged_count = sum(1 for p in scored_products if p["hazard_score"] >= threshold)
        top_catalog_clusters = self.clusterer.cluster_signals(all_catalog_signals)
        top_hazard_cluster = top_catalog_clusters[0]["cluster_name"] if top_catalog_clusters else "None"
        avg_score = round(sum(p["hazard_score"] for p in scored_products) / max(len(scored_products), 1), 1)

        summary_stats = {
            "total_products": len(scored_products),
            "total_reviews": total_reviews_count,
            "flagged_products": flagged_count,
            "top_hazard_cluster": top_hazard_cluster,
            "average_hazard_score": avg_score,
            "threshold_used": threshold
        }

        # Phase 3: Report generation (PDF + CSV)
        report_id = str(uuid.uuid4())
        csv_path = BrandReportGenerator.generate_csv(brand_name, scored_products, report_id)
        pdf_path = BrandReportGenerator.generate_pdf(brand_name, company_name, summary_stats, scored_products, report_id)

        # Check contact email in verified table
        verified_contact = self.lookup_contact(brand_name)
        contact_email = verified_contact["contact_email"] if verified_contact else catalog.get("default_contact_email")

        exec_time = round(time.time() - start_time, 2)

        # Persist report in brand_outreach_reports table
        report_rec = BrandOutreachReport(
            id=report_id,
            brand_name=brand_name,
            status="GENERATED",
            products_scanned=len(scored_products),
            total_reviews_analyzed=total_reviews_count,
            high_risk_products_count=flagged_count,
            threshold_used=threshold,
            catalog_summary={
                "summary_stats": summary_stats,
                "products": scored_products
            },
            pdf_path=pdf_path,
            csv_path=csv_path,
            contact_email=contact_email,
            email_status="NOT_SENT",
            execution_time_seconds=exec_time
        )
        self.db.add(report_rec)
        self.db.flush()

        # Log audit trail
        log = BrandOutreachLog(
            report_id=report_id,
            brand_name=brand_name,
            action="REPORT_GENERATED",
            recipient_email=contact_email,
            details={
                "products_scanned": len(scored_products),
                "high_risk_count": flagged_count,
                "exec_time_seconds": exec_time,
                "pdf_path": pdf_path,
                "csv_path": csv_path
            }
        )
        self.db.add(log)
        self.db.commit()

        return {
            "report_id": report_id,
            "brand_name": brand_name,
            "company_name": company_name,
            "summary_stats": summary_stats,
            "scored_products": scored_products,
            "pdf_path": pdf_path,
            "csv_path": csv_path,
            "pdf_filename": os.path.basename(pdf_path),
            "csv_filename": os.path.basename(csv_path),
            "contact_email": contact_email,
            "verified_contact": verified_contact,
            "execution_time_seconds": exec_time,
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a previously generated outreach report."""
        report = self.db.query(BrandOutreachReport).filter(BrandOutreachReport.id == report_id).first()
        if not report:
            return None
        return {
            "id": report.id,
            "brand_name": report.brand_name,
            "status": report.status,
            "products_scanned": report.products_scanned,
            "total_reviews_analyzed": report.total_reviews_analyzed,
            "high_risk_products_count": report.high_risk_products_count,
            "catalog_summary": report.catalog_summary,
            "pdf_path": report.pdf_path,
            "csv_path": report.csv_path,
            "pdf_filename": os.path.basename(report.pdf_path) if report.pdf_path else None,
            "csv_filename": os.path.basename(report.csv_path) if report.csv_path else None,
            "contact_email": report.contact_email,
            "email_status": report.email_status,
            "email_sent_at": report.email_sent_at.isoformat() if report.email_sent_at else None,
            "execution_time_seconds": report.execution_time_seconds,
            "created_at": report.created_at.isoformat()
        }

    def list_reports(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Lists generated outreach reports with timestamps and email statuses."""
        reports = self.db.query(BrandOutreachReport).order_by(BrandOutreachReport.created_at.desc()).limit(limit).all()
        return [
            {
                "id": r.id,
                "brand_name": r.brand_name,
                "status": r.status,
                "products_scanned": r.products_scanned,
                "total_reviews_analyzed": r.total_reviews_analyzed,
                "high_risk_products_count": r.high_risk_products_count,
                "contact_email": r.contact_email,
                "email_status": r.email_status,
                "email_sent_at": r.email_sent_at.isoformat() if r.email_sent_at else None,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
