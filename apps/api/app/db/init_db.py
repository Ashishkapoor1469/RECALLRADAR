from sqlalchemy import text
from app.db.session import engine, Base
import app.models # Load all models

def init_db():
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
        except Exception as e:
            print(f"Note: Vector extension creation: {e}")
    
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")

if __name__ == "__main__":
    init_db()
