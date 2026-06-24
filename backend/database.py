"""
database.py
Database engine and session factory.
Import `Base` here and extend it in models.py.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# When running via Docker Compose the DATABASE_URL env var is injected by the
# compose file (pointing at the `db` service).  Outside Docker the fallback
# keeps local development working without any extra setup.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:root@localhost/hcai_db",
)

engine       = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base         = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
