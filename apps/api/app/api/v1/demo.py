import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/load")
def load_demo_dataset():
    """Seeds the offline synthetic dataset into the database."""
    try:
        from app.db.seed import seed_database
        seed_database()
        return {"status": "success", "message": "Demo dataset loaded successfully."}
    except Exception as e:
        logger.error(f"Error loading demo dataset: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

@router.post("/reset")
def reset_demo():
    """Resets the demo state."""
    try:
        from app.db.seed import seed_database
        seed_database()
        return {"status": "success", "message": "Demo state reset successfully."}
    except Exception as e:
        logger.error(f"Error resetting demo state: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

