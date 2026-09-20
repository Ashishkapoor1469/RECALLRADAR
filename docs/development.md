# RecallRadar — Local Development & Setup Guide

## Quick Start with Docker

```bash
# 1. Clone repository & copy environment configuration
cp .env.example .env

# 2. Start PostgreSQL, Redis, FastAPI, Celery, Next.js web via Docker Compose
docker compose up --build -d

# 3. Seed offline synthetic dataset
make seed

# 4. Open web dashboard in browser
# Dashboard: http://localhost:3000
# API Docs:  http://localhost:8000/docs
```

## Running Without Docker

```bash
# Backend Setup
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed Database
python -m scripts.seed_db

# Start FastAPI server
uvicorn app.main:app --reload --port 8000

# Frontend Setup
cd apps/web
npm install
npm run dev
```

## Running Verification Test Suite

```bash
python scripts/run_all_tests.py
```
