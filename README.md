# NCD-CDS-System
An AI-Assisted Clinical Decision Support System

## Database Foundation (Step 2)

The stack now ships with a PostgreSQL service and a Prisma schema so we can start persisting patient and visit data in upcoming steps while keeping the current Drools-driven workflow intact.

### Quick Start

```bash
# From the repo root
docker compose up postgres -d

# Copy env example (optional, for local tooling outside Compose)
cd backend
cp env.example .env

# Install Prisma CLI (local dev dependency)
npm install --prefix . --save-dev prisma

# Create tables in PostgreSQL
npx prisma db push --schema prisma/schema.prisma
```

- `docker-compose.yml` exposes the database on port `5432`.
- The Prisma schema defines `Patient`, `Visit`, and `FollowUpSchedule` with UUID identifiers to match the upcoming backend models.
- No backend endpoints use the database yet; this step only establishes the schema and tooling so later changes can hook into it safely.