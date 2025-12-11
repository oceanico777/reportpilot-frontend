@echo off
cd backend
echo Installing dependencies...
pip install -r requirements.txt
echo Starting server...
uvicorn app.main:app --reload
pause
