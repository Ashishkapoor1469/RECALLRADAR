from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings

from sqlalchemy.pool import NullPool

connect_args = {"application_name": "earlyecho"}
if "postgresql" in settings.sync_database_url:
    connect_args["connect_timeout"] = 10
    connect_args["sslmode"] = "require"

is_supabase_pooler = "pooler.supabase.com" in settings.sync_database_url or ":6543" in settings.sync_database_url

if is_supabase_pooler:
    # Supabase Transaction Pooler (port 6543 / pgBouncer):
    # NullPool delegates connection lifecycle to pgBouncer, preventing abrupt connection resets
    engine = create_engine(
        settings.sync_database_url,
        poolclass=NullPool,
        connect_args=connect_args
    )
else:
    engine = create_engine(
        settings.sync_database_url,
        pool_pre_ping=True,
        pool_recycle=60,
        pool_size=5,
        max_overflow=10,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
