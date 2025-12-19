@echo off
echo ==========================================
echo    Docker Image Fixer
echo ==========================================
echo.
echo 1. Pulling Redis...
docker pull redis:7-alpine

echo.
echo 2. Pulling Postgres...
docker pull postgres:15-alpine

echo.
echo 3. Pulling Python Base...
docker pull python:3.11-slim

echo.
echo 4. Rebuilding Project...
docker-compose build --no-cache

echo.
echo 5. Starting Services...
docker-compose up

pause
