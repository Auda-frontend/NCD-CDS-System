# Database Connection Guide

## Connecting to Docker PostgreSQL from Local Machine

The Docker PostgreSQL container exposes port `5432` to your local machine, so you can connect using your local `psql` client.

### Quick Connection

**Windows PowerShell:**
```powershell
psql -h localhost -p 5432 -U auda -d clinical_cds
```

**Windows Command Prompt:**
```cmd
psql -h localhost -p 5432 -U auda -d clinical_cds
```

**Linux/Mac:**
```bash
psql -h localhost -p 5432 -U auda -d clinical_cds
```

**Password:** `N1saw2Auda`

### Connection Details

- **Host:** `localhost` (or `127.0.0.1`)
- **Port:** `5432`
- **Database:** `clinical_cds`
- **Username:** `auda`
- **Password:** `N1saw2Auda`

### Using Connection Scripts

We've provided helper scripts:

**PowerShell:**
```powershell
.\connect_db.ps1
```

**Batch (Windows):**
```cmd
connect_db.bat
```

### Troubleshooting

#### Port Conflict (Port 5432 Already in Use)

If you get a connection error like "connection refused" or "port already in use", you might have a local PostgreSQL instance running on port 5432.

**Option 1: Stop Local PostgreSQL**
```powershell
# Windows - Stop PostgreSQL service
Stop-Service postgresql-x64-15  # Adjust version number as needed

# Or use Services GUI: services.msc
```

**Option 2: Use Different Port for Docker**

Edit `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Map Docker's 5432 to host's 5433
```

Then connect with:
```powershell
psql -h localhost -p 5433 -U auda -d clinical_cds
```

**Option 3: Check What's Using Port 5432**
```powershell
# Windows
netstat -ano | findstr :5432

# Or use PowerShell
Get-NetTCPConnection -LocalPort 5432
```

#### Container Not Running

If the container isn't running:
```powershell
docker compose up postgres -d
```

#### Verify Container is Running
```powershell
docker ps | findstr postgres
```

### Alternative: Using Docker Exec (Always Works)

If local connection doesn't work, you can always use Docker exec:

```powershell
# Interactive session
docker exec -it cds_postgres psql -U auda -d clinical_cds

# One-line query
docker exec cds_postgres psql -U auda -d clinical_cds -c "SELECT * FROM patients;"
```

### Using Adminer (Web Interface)

Access Adminer at: http://localhost:8080

Login details:
- **System:** PostgreSQL
- **Server:** `postgres` (or `cds_postgres`)
- **Username:** `auda`
- **Password:** `N1saw2Auda`
- **Database:** `clinical_cds`

### Common Queries

Once connected, try these:

```sql
-- List all tables
\dt

-- View patients table
SELECT * FROM patients;

-- Count patients
SELECT COUNT(*) FROM patients;

-- View table structure
\d patients

-- Exit psql
\q
```
