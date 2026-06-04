Write-Host "Starting Data Orchestrator Services..." -ForegroundColor Green

# 1. Start Backend API in a new window
Write-Host "Starting Backend API in a new window..."
Start-Process powershell -WorkingDirectory "backend" -ArgumentList "-NoExit -Command .\venv\Scripts\python.exe -m uvicorn app.main:app --reload"

# 2. Start Frontend in a new window
Write-Host "Starting Frontend in a new window..."
Start-Process powershell -WorkingDirectory "frontend" -ArgumentList "-NoExit -Command npm run dev"

# Wait for frontend server to be up
Write-Host "Waiting for services to initialize..."
Start-Sleep -Seconds 5

# 3. Open browser automatically
Write-Host "Opening application in browser..."
Start-Process "http://localhost:5173"

Write-Host "All services started! (Celery tasks are running synchronously within the backend API)" -ForegroundColor Green
