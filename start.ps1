# RecallRadar One-Click Application Startup Script (PowerShell)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Starting RecallRadar — Know a product is unsafe before recall" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "apps/api"

# Step 1: Ensure database is seeded
Write-Host "`n[1/3] Checking and seeding offline synthetic database..." -ForegroundColor Yellow
python scripts/seed_db.py

# Step 2: Start FastAPI Backend API Server on Port 8000
Write-Host "`n[2/3] Starting FastAPI Backend API Server on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    $env:PYTHONPATH = "apps/api"
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
}

# Wait 2 seconds for backend to start up
Start-Sleep -Seconds 2

# Check backend health
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -ErrorAction Stop
    Write-Host " -> Backend API Status: ONLINE ($($health.service) v$($health.version))" -ForegroundColor Green
} catch {
    Write-Host " -> Warning: Backend starting up..." -ForegroundColor Yellow
}

# Step 3: Start Next.js Frontend Dev Server on Port 3000
Write-Host "`n[3/3] Starting Next.js Web Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop servers when done.`n" -ForegroundColor Gray

# Open browser automatically
Start-Process "http://localhost:3000"

# Run frontend in foreground
Set-Location "$PSScriptRoot\apps\web"
npm run dev
