@echo off
echo ==========================================
echo    ReportPilot AI - REBUILD Backend
echo ==========================================
echo.
echo Stopping and removing old containers...
docker-compose down

echo.
echo Rebuilding with new environment variables...
docker-compose up --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed with docker-compose.
    echo Trying 'docker compose' instead...
    docker compose down
    docker compose up --build
)

if %errorlevel% neq 0 (
    echo.
    echo [FATAL] Could not rebuild. Please ensure Docker Desktop is running.
    pause
)
