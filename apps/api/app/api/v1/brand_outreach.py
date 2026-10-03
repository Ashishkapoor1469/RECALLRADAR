import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.brand_outreach_service import BrandOutreachService
from app.services.brand_catalog_provider import BrandCatalogProvider

router = APIRouter()


class BrandAnalyzeRequest(BaseModel):
    query: str
    threshold: Optional[float] = 50.0


class ContactUpdateRequest(BaseModel):
    brand_name: str
    contact_email: str
    contact_person: Optional[str] = None
    notes: Optional[str] = None


@router.get("/supported-brands")
def get_supported_brands():
    """Returns available benchmark brand catalogs with pre-scanned datasets."""
    return BrandCatalogProvider.list_supported_brands()


@router.post("/analyze")
def analyze_brand(payload: BrandAnalyzeRequest, db: Session = Depends(get_db)):
    """Runs Phase 1 (lookup), Phase 2 (cold-start hazard scoring), and Phase 3 (PDF/CSV report generation)."""
    if not payload.query or not payload.query.strip():
        raise HTTPException(status_code=400, detail="Brand name, ASIN, or product URL is required.")

    service = BrandOutreachService(db)
    try:
        result = service.analyze_brand(payload.query.strip(), threshold=payload.threshold or 50.0)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Brand analysis failed: {str(e)}")


@router.get("/reports")
def list_reports(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Lists generated outreach reports."""
    service = BrandOutreachService(db)
    return service.list_reports(limit=limit)


@router.get("/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Gets details of an existing outreach report."""
    service = BrandOutreachService(db)
    report = service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Outreach report not found.")
    return report


@router.get("/reports/{report_id}/download-pdf")
def download_pdf(report_id: str, db: Session = Depends(get_db)):
    """Downloads the generated PDF report."""
    service = BrandOutreachService(db)
    report = service.get_report(report_id)
    if not report or not report.get("pdf_path") or not os.path.exists(report["pdf_path"]):
        raise HTTPException(status_code=404, detail="PDF report file not found.")

    return FileResponse(
        path=report["pdf_path"],
        filename=report.get("pdf_filename") or f"EarlyEcho_Outreach_{report_id[:8]}.pdf",
        media_type="application/pdf"
    )


@router.get("/reports/{report_id}/download-csv")
def download_csv(report_id: str, db: Session = Depends(get_db)):
    """Downloads the generated CSV report."""
    service = BrandOutreachService(db)
    report = service.get_report(report_id)
    if not report or not report.get("csv_path") or not os.path.exists(report["csv_path"]):
        raise HTTPException(status_code=404, detail="CSV report file not found.")

    return FileResponse(
        path=report["csv_path"],
        filename=report.get("csv_filename") or f"EarlyEcho_Outreach_{report_id[:8]}.csv",
        media_type="text/csv"
    )


@router.get("/contacts/{brand_name}")
def get_contact(brand_name: str, db: Session = Depends(get_db)):
    """Looks up verified outreach contact for a brand."""
    service = BrandOutreachService(db)
    contact = service.lookup_contact(brand_name)
    if not contact:
        return {"brand_name": brand_name, "verified": False, "contact_email": None}
    return contact


@router.post("/contacts")
def upsert_contact(payload: ContactUpdateRequest, db: Session = Depends(get_db)):
    """Human verification / update of brand outreach contact."""
    service = BrandOutreachService(db)
    contact = service.upsert_contact(
        brand_name=payload.brand_name,
        email=payload.contact_email,
        contact_person=payload.contact_person,
        notes=payload.notes
    )
    return contact
