# PowerShell script to reset Alembic migrations and recreate all tables
# WARNING: This will delete all data!

Write-Host "Resetting Alembic migrations..." -ForegroundColor Yellow

# Delete alembic_version table to reset migration state
docker compose exec -T postgres psql -U auda -d clinical_cds -c "DROP TABLE IF EXISTS alembic_version CASCADE;"

# Now run migrations from scratch
Write-Host "Running migrations from scratch..." -ForegroundColor Yellow
docker compose exec backend alembic upgrade head

Write-Host "Done! Verifying tables..." -ForegroundColor Green
docker compose exec postgres psql -U auda -d clinical_cds -c "\dt"

