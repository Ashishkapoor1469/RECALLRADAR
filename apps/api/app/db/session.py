from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

try:
    connect_args = {"application_name": "earlyecho"}
    if "postgresql" in settings.sync_database_url:
        connect_args["connect_timeout"] = 15
        connect_args["sslmode"] = "require"

    engine = create_engine(
        settings.sync_database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args
    )
    with engine.connect() as conn:
        print("Connected to PostgreSQL database successfully.")
except Exception as e:
    print(f"Primary PostgreSQL connection failed ({e}). Falling back to SQLite local database.")
    sqlite_url = "sqlite:///./recallradar.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
