from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import AuditLog

def log_audit(
    db: Session,
    action: str,
    target: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None
) -> Optional[AuditLog]:
    """Append-only audit logger for tracking rule creation, alert dispatch, and data exports."""
    try:
        entry = AuditLog(
            action=action,
            target=str(target) if target else None,
            detail=detail,
            timestamp=datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
    except Exception as e:
        print(f"Audit log warning: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        return None
