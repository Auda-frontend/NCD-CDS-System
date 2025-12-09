# PowerShell script to connect to Docker PostgreSQL database
# Usage: .\connect_db.ps1

Write-Host "Connecting to Docker PostgreSQL database..." -ForegroundColor Cyan
Write-Host "Host: localhost" -ForegroundColor Yellow
Write-Host "Port: 5432" -ForegroundColor Yellow
Write-Host "Database: clinical_cds" -ForegroundColor Yellow
Write-Host "User: auda" -ForegroundColor Yellow
Write-Host ""

# Check if Docker container is running
$container = docker ps --filter "name=cds_postgres" --format "{{.Names}}"
if (-not $container) {
    Write-Host "ERROR: Docker container 'cds_postgres' is not running!" -ForegroundColor Red
    Write-Host "Please start it with: docker compose up postgres -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Docker container is running: $container" -ForegroundColor Green
Write-Host ""

# Connect to database
psql -h localhost -p 5432 -U auda -d clinical_cds
