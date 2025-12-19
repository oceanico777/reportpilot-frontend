@echo off
echo ==========================================
echo    ReportPilot AI - FINAL REBUILD
echo    (With Root .env File)
echo ==========================================
echo.
echo Stopping all containers...
docker-compose down

echo.
echo Removing containers to force env reload...
docker-compose rm -f

echo.
echo Starting with NEW environment variables from .env...
docker-compose up --build --force-recreate -d

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak

echo.
echo Verifying worker has new API key...
docker-compose exec celery_worker env | findstr GEMINI

echo.
echo ==========================================
echo    Services are running!
echo    Check above to verify API key changed
echo ==========================================
pause
