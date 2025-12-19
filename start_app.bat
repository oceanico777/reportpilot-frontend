@echo off
echo ==========================================
echo    ReportPilot AI - Launcher
echo ==========================================
echo.
echo Starting Docker services...
echo.

docker-compose up --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run with docker-compose.
    echo Trying 'docker compose' instead...
    docker compose up --build
)

if %errorlevel% neq 0 (
    echo.
    echo [FATAL] Could not start Docker. Please ensure Docker Desktop is running.
    pause
)
