#!/bin/bash
# Reset Alembic migrations and recreate all tables
# WARNING: This will delete all data!

echo "Resetting Alembic migrations..."

# Delete alembic_version table to reset migration state
docker compose exec -T postgres psql -U auda -d clinical_cds <<EOF
DROP TABLE IF EXISTS alembic_version CASCADE;
EOF

# Now run migrations from scratch
echo "Running migrations from scratch..."
docker compose exec backend alembic upgrade head

echo "Done! Verifying tables..."
docker compose exec postgres psql -U auda -d clinical_cds -c "\dt"

