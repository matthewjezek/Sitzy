# === SPUŠTĚNÍ FASTAPI ===
run:
	uvicorn api.main:app --reload

# === FORMATOVÁNÍ ===
format:
	black api
	isort api
	flake8 api
	mypy api

# === TESTY ===
test:
	pytest api/tests

# === PRE-COMMIT HOOKS ===
setup-hooks:
	.venv/Scripts/pip install pre-commit
	.venv/Scripts/pre-commit install