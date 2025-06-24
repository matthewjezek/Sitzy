import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Načtení proměnných z .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL není nastavený v .env souboru.")

# SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=True, future=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Deklarativní základna pro modely
Base = declarative_base()

# Funkce pro získání databázové relace
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
