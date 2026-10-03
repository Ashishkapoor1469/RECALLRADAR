import sys
import os

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO_ROOT = os.path.abspath(os.path.join(API_DIR, "..", ".."))
for path_entry in [API_DIR, REPO_ROOT]:
    if path_entry not in sys.path:
        sys.path.insert(0, path_entry)


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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*", "ngrok-skip-browser-warning"],
    expose_headers=["*"],
)

from app.api.v1.router import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    from app.db.session import engine
    print(f"EarlyEcho API starting with database engine: {engine.dialect.name}")

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
