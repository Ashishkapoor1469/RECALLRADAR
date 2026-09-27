import sys
import os

curr = os.path.abspath(os.path.dirname(__file__))
while curr and curr != os.path.dirname(curr):
    if os.path.exists(os.path.join(curr, "scripts", "seed_db.py")):
        if curr not in sys.path:
            sys.path.insert(0, curr)
        break
    curr = os.path.dirname(curr)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.router import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    from app.db.session import engine, Base, SessionLocal
    import app.models  # ensure models loaded
    try:
        from app.db.init_db import init_db
        init_db()
    except Exception as e:
        print(f"Startup init_db notice: {e}")
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as ce:
            print(f"Base.metadata.create_all error: {ce}")

    # Ensure at least synthetic seed data exists so database is never empty
    try:
        from app.models import Product
        with SessionLocal() as db:
            if db.query(Product).count() == 0:
                print("Empty database catalog detected on startup. Inserting baseline fixtures...")
                from data.synthetic.generator import generate_synthetic_dataset
                dataset = generate_synthetic_dataset()
                for p in dataset["products"]:
                    product = Product(
                        id=p["id"],
                        external_id=p["external_id"],
                        name=p["name"],
                        brand=p["brand"],
                        category=p["category"],
                        description=p.get("description", "")
                    )
                    db.merge(product)
                db.commit()
                print("Baseline fixtures inserted successfully.")
    except Exception as se:
        print(f"Startup baseline seed notice: {se}")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to RecallRadar API — Know a product is unsafe before the recall.",
        "docs": "/docs",
        "health": "/health"
    }
