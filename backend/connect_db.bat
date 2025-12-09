@echo off
REM Batch script to connect to Docker PostgreSQL database
REM Usage: connect_db.bat

echo Connecting to Docker PostgreSQL database...
echo Host: localhost
echo Port: 5432
echo Database: clinical_cds
echo User: auda
echo.

REM Check if Docker container is running
docker ps --filter "name=cds_postgres" --format "{{.Names}}" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker container 'cds_postgres' is not running!
    echo Please start it with: docker compose up postgres -d
    pause
    exit /b 1
)

echo Docker container is running
echo.

REM Connect to database
psql -h localhost -p 5432 -U auda -d clinical_cds
