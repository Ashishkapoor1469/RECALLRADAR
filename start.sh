#!/bin/bash
echo "============================================================"
echo " Starting RecallRadar — Safety Intelligence System"
echo "============================================================"

export PYTHONPATH=apps/api

echo ""
echo "[1/3] Seeding Database..."
python3 scripts/seed_db.py

echo ""
echo "[2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 2

echo ""
echo "[3/3] Starting Next.js Frontend on http://localhost:3000 ..."
cd apps/web && npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "============================================================"
echo " RecallRadar is running!"
echo " - Frontend: http://localhost:3000"
echo " - Backend API: http://localhost:8000"
echo " - API Docs: http://localhost:8000/docs"
echo " Press Ctrl+C to stop."
echo "============================================================"

wait
