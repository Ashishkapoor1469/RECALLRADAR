.PHONY: setup up down build test seed demo clean start help

help:
	@echo "RecallRadar Build Targets:"
	@echo "  make start    - Start both FastAPI backend and Next.js frontend"
	@echo "  make setup    - Install dependencies and prepare environment"
	@echo "  make up       - Start all Docker containers"
	@echo "  make down     - Stop all Docker containers"
	@echo "  make build    - Rebuild Docker images"
	@echo "  make migrate  - Run database migrations"
	@echo "  make seed     - Seed synthetic dataset into database"
	@echo "  make demo     - Run full end-to-end synthetic demo pipeline"
	@echo "  make test     - Run Python backend & E2E tests"
	@echo "  make clean    - Remove build caches and containers"


start:
	python scripts/seed_db.py
	powershell -ExecutionPolicy Bypass -File start.ps1
	cp -n .env.example .env || true
	cd apps/api && pip install -r requirements.txt
	cd apps/web && npm install

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

migrate:
	cd apps/api && alembic upgrade head

seed:
	cd apps/api && python -m scripts.seed_db

demo:
	cd apps/api && python -m scripts.run_demo_pipeline

test:
	cd apps/api && pytest
	cd apps/web && npm test

clean:
	docker compose down -v
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type d -name ".pytest_cache" -exec rm -r {} +
