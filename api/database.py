import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Načtení proměnných z .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true"


def normalize_database_url(url: str) -> str:
    """Normalize provider-specific URLs for SQLAlchemy compatibility."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

if not DATABASE_URL:
    raise ValueError("DATABASE_URL není nastavený v .env souboru.")

DATABASE_URL = normalize_database_url(DATABASE_URL)

# SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=SQLALCHEMY_ECHO, future=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Funkce pro získání databázové relace
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
