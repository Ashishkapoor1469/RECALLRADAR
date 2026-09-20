import sys
import os
from fastapi import APIRouter

curr = os.path.abspath(os.path.dirname(__file__))
while curr and curr != os.path.dirname(curr):
    if os.path.exists(os.path.join(curr, "scripts", "seed_db.py")):
        if curr not in sys.path:
            sys.path.insert(0, curr)
        break
    curr = os.path.dirname(curr)

from scripts.seed_db import seed_database

router = APIRouter()

@router.post("/load")
def load_demo_dataset():
    """Seeds the offline synthetic dataset into the database."""
    try:
        seed_database()
        return {"status": "success", "message": "Demo dataset loaded successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/reset")
def reset_demo():
    """Resets the demo state."""
    try:
        seed_database()
        return {"status": "success", "message": "Demo state reset successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
