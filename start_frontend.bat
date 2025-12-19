@echo off
echo ==========================================
echo    ReportPilot AI - Frontend Launcher
echo ==========================================
echo.
cd frontend

if not exist node_modules (
    echo [INFO] Installing dependencies - First run only...
    call npm install
)

echo [INFO] Starting Frontend Server...
call npm run dev
