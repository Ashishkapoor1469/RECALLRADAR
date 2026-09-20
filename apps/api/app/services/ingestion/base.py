from typing import Protocol, List, Dict, Any, Optional
from datetime import datetime

class DataSourceAdapter(Protocol):
    """Protocol for unified data source adapters."""
    
    def fetch(self, limit: int = 100, **kwargs) -> List[Dict[str, Any]]:
        """Fetch raw records from external API or local file."""
        ...

    def validate(self, raw_record: Dict[str, Any]) -> bool:
        """Validate required fields in raw record."""
        ...

    def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw record into internal schema format."""
        ...

class BaseAdapter:
    """Base class providing common logging and provenance utilities."""
    
    def __init__(self, source_name: str):
        self.source_name = source_name

    def format_provenance(self, external_id: str) -> Dict[str, Any]:
        return {
            "source": self.source_name,
            "external_id": str(external_id),
            "ingestion_timestamp": datetime.utcnow().isoformat()
        }
