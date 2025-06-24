# === SPUŠTĚNÍ FASTAPI ===
run:
	uvicorn api.main:app --reload

# === VYTVOŘENÍ DB TABULEK (DOČASNĚ BEZ ALEMBICU) ===
init-db:
	python -c "from api.database import Base, engine; Base.metadata.create_all(bind=engine)"

# === VYTVOŘENÍ .ENV ZE ŠABLONY ===
env:
	cp .env.example .env

# === FORMATOVÁNÍ ===
format:
	black api
	isort api

# === TESTY ===
test:
	pytest api/tests