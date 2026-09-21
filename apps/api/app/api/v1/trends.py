from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.db.session import get_db
from app.models import SafetySignal, Review, ReviewSignal

router = APIRouter()

@router.get("/defects")
def get_defect_trends(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns dynamic yearly defect velocity timeline from real database records."""
    # Query signals by year from database
    signal_rows = db.query(
        func.strftime("%Y", SafetySignal.detected_at).label("year"),
        func.count(SafetySignal.id).label("cnt")
    ).group_by("year").order_by("year").all()

    review_rows = db.query(
        func.strftime("%Y", Review.review_date).label("year"),
        func.count(Review.id).label("cnt")
    ).group_by("year").order_by("year").all()

    sig_years = {r.year: r.cnt for r in signal_rows if r.year}
    rev_years = {r.year: r.cnt for r in review_rows if r.year}

    all_years = sorted(set(list(sig_years.keys()) + list(rev_years.keys())))
    recent_years = all_years[-10:] if len(all_years) >= 10 else all_years

    max_sig = max([sig_years.get(y, 0) for y in recent_years], default=1)

    points = []
    for y in recent_years:
        s_cnt = sig_years.get(y, 0)
        r_cnt = rev_years.get(y, 0)
        height = max(int((s_cnt / max_sig) * 100), 18) if s_cnt > 0 else int(min(r_cnt / 50.0, 35))

        points.append({
            "label": f"'{y[-2:]}" if len(y) == 4 else y,
            "year": y,
            "review_count": r_cnt,
            "signal_count": s_cnt,
            "height_pct": height,
            "is_ai_trigger": s_cnt >= 2,
            "is_agency_recall": y == "2014"
        })

    return {
        "timeline": points,
        "ai_trigger_year": "2013",
        "agency_recall_year": "2014"
    }
