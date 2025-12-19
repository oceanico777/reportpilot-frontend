@echo off
echo ==========================================
echo    ReportPilot AI - FORCE REBUILD
echo ==========================================
echo.
echo Stopping all containers...
docker-compose down

echo.
echo Removing all containers and images...
docker-compose rm -f

echo.
echo Building fresh containers with new environment...
docker-compose up --build --force-recreate

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed with docker-compose.
    echo Trying 'docker compose' instead...
    docker compose down
    docker compose rm -f
    docker compose up --build --force-recreate
)

if %errorlevel% neq 0 (
    echo.
    echo [FATAL] Could not rebuild. Please ensure Docker Desktop is running.
    pause
)
