from typing import List, Dict, Any, Optional
from datetime import datetime
import httpx
from app.services.ingestion.base import BaseAdapter, DataSourceAdapter

class CPSCAdapter(BaseAdapter):
    """Adapter for Consumer Product Safety Commission (CPSC) Recall API."""
    
    def __init__(self, base_url: Optional[str] = None):
        super().__init__(source_name="cpsc")
        self.base_url = base_url or "https://www.saferproducts.gov/RestServices/Recall"

    def fetch(self, limit: int = 50, **kwargs) -> List[Dict[str, Any]]:
        """Fetch raw recall announcements from CPSC REST API."""
        try:
            params = {"format": "json"}
            response = httpx.get(f"{self.base_url}?format=json", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return data[:limit] if isinstance(data, list) else []
        except Exception as e:
            print(f"CPSC API fetch warning: {e}. Returning empty list.")
        return []

    def validate(self, raw_record: Dict[str, Any]) -> bool:
        return "RecallID" in raw_record or "RecallTitle" in raw_record

    def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        recall_id = str(raw_record.get("RecallID", raw_record.get("RecallNumber", "")))
        recall_date_str = raw_record.get("RecallDate", "")
        
        try:
            recall_date = datetime.strptime(recall_date_str[:10], "%Y-%m-%d") if recall_date_str else datetime.utcnow()
        except ValueError:
            recall_date = datetime.utcnow()

        products = raw_record.get("Products", [])
        prod_name = products[0].get("Name", "Unknown Product") if products else raw_record.get("RecallTitle", "Unknown Product")
        
        hazards = raw_record.get("Hazards", [])
        hazard_desc = hazards[0].get("Name", "") if hazards else raw_record.get("Description", "")

        return {
            "external_id": recall_id,
            "product_name": prod_name,
            "category": raw_record.get("ConsumerProductTypes", [{}])[0].get("Name", "General"),
            "recall_date": recall_date,
            "description": raw_record.get("Description", ""),
            "hazard": hazard_desc,
            "remedy": raw_record.get("Remedies", [{}])[0].get("Name", "Refund or Replace"),
            "source": self.source_name
        }


class SaferProductsAdapter(BaseAdapter):
    """Adapter for SaferProducts.gov public incident safety reports."""
    
    def __init__(self, base_url: Optional[str] = None):
        super().__init__(source_name="saferproducts")
        self.base_url = base_url or "https://www.saferproducts.gov/RestServices/Incident"

    def fetch(self, limit: int = 50, **kwargs) -> List[Dict[str, Any]]:
        try:
            response = httpx.get(f"{self.base_url}?format=json", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return data[:limit] if isinstance(data, list) else []
        except Exception as e:
            print(f"SaferProducts API fetch warning: {e}. Returning empty list.")
        return []

    def validate(self, raw_record: Dict[str, Any]) -> bool:
        return "IncidentReportNo" in raw_record or "ReportDate" in raw_record

    def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        report_id = str(raw_record.get("IncidentReportNo", ""))
        report_date_str = raw_record.get("ReportDate", "")
        
        try:
            report_date = datetime.strptime(report_date_str[:10], "%Y-%m-%d") if report_date_str else datetime.utcnow()
        except ValueError:
            report_date = datetime.utcnow()

        return {
            "external_id": report_id,
            "product_name": raw_record.get("ProductName", "Unknown Product"),
            "category": raw_record.get("ProductCategory", "General"),
            "report_date": report_date,
            "description": raw_record.get("IncidentDescription", ""),
            "severity": 3 if "injury" in raw_record.get("IncidentDescription", "").lower() else 2,
            "source": self.source_name
        }


class AmazonReviewsAdapter(BaseAdapter):
    """Adapter for Amazon Reviews 2023 dataset structure."""
    
    def __init__(self):
        super().__init__(source_name="amazon")

    def fetch(self, limit: int = 50, **kwargs) -> List[Dict[str, Any]]:
        return kwargs.get("sample_records", [])[:limit]

    def validate(self, raw_record: Dict[str, Any]) -> bool:
        return "asin" in raw_record and ("text" in raw_record or "review_body" in raw_record or "body" in raw_record)

    def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        external_id = str(raw_record.get("review_id", raw_record.get("id", f"AMZ-{raw_record.get('asin')}-{random_hash()}")))
        body = raw_record.get("text", raw_record.get("review_body", raw_record.get("body", "")))
        title = raw_record.get("title", raw_record.get("summary", ""))
        rating = float(raw_record.get("rating", raw_record.get("stars", 3.0)))
        
        date_val = raw_record.get("timestamp", raw_record.get("review_date", None))
        if isinstance(date_val, (int, float)):
            review_date = datetime.fromtimestamp(date_val / 1000.0 if date_val > 1e10 else date_val)
        elif isinstance(date_val, str):
            try:
                review_date = datetime.strptime(date_val[:10], "%Y-%m-%d")
            except ValueError:
                review_date = datetime.utcnow()
        else:
            review_date = datetime.utcnow()

        return {
            "external_id": external_id,
            "product_external_id": raw_record.get("asin", ""),
            "rating": rating,
            "title": title,
            "body": body,
            "review_date": review_date,
            "verified": raw_record.get("verified_purchase", True),
            "source": self.source_name
        }

def random_hash():
    import uuid
    return str(uuid.uuid4())[:8]
