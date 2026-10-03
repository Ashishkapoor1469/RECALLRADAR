import sys
import os

# Add root and apps/api directory to sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
API_DIR = os.path.abspath(os.path.join(REPO_ROOT, "apps", "api"))
for p in [API_DIR, REPO_ROOT]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.db.seed import seed_database

if __name__ == "__main__":
    csv_arg = sys.argv[1] if len(sys.argv) > 1 else None
    seed_database(csv_path=csv_arg)
