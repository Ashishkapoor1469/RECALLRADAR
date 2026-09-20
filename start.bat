@echo off
title RecallRadar Application Launcher
echo ============================================================
echo  Starting RecallRadar — Safety Intelligence System
echo ============================================================

set PYTHONPATH=apps/api

echo.
echo [1/3] Seeding Database...
python scripts/seed_db.py

echo.
echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "RecallRadar FastAPI Backend" cmd /k "set PYTHONPATH=apps/api && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak > NUL

echo.
echo [3/3] Starting Next.js Frontend on http://localhost:3000 ...
start "RecallRadar Next.js Frontend" cmd /k "cd apps/web && npm run dev"

timeout /t 3 /nobreak > NUL
start http://localhost:3000

echo ============================================================
echo  RecallRadar is running!
echo  - Frontend: http://localhost:3000
echo  - Backend API: http://localhost:8000
echo  - API Docs: http://localhost:8000/docs
echo ============================================================
pause
