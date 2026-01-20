# Clinical Decision Support System (NCD-CDS-System)

This repository contains a full-stack Clinical Decision Support (CDS) system for non-communicable diseases (NCDs) focused on Rwanda's hypertension and diabetes management workflows. It combines a React frontend, a FastAPI backend (Python, async SQLAlchemy), a Postgres database, and a rules engine implemented with Drools (Java). The Drools engine is built into a runnable fat JAR and invoked by the backend to produce clinical recommendations from structured patient data.

This README is intentionally expansive and verbose. It documents architecture, data flow, file locations, runtime configuration, APIs, integration details, build and deployment steps, troubleshooting, and production hardening suggestions.

---

**Quick Summary (one-line):** Web UI sends patient/visit data → FastAPI receives and persists as needed → backend formats and calls Drools JAR to evaluate rules → Drools returns JSON decisions → backend saves recommendations and returns CDSResponse → UI displays recommendations and provides actions to create prescriptions or order tests.

---

**Table of Contents**
- Project purpose
- High-level architecture
- Component-level details
  - Backend (FastAPI)
  - Database (Postgres + Alembic)
  - Rules engine (Drools Java project)
  - Frontend (React + Vite + Tailwind)
- End-to-end data flow
- API endpoints and payloads
- Important files and locations
- Build & run (development and Docker)
- Deployment specifics (docker-compose, Dockerfiles)
- Operational considerations and environment variables
- Troubleshooting checklist
- Production hardening and scaling notes
- Contributing and next steps

---

**Project purpose**
This project implements an AI-assisted Clinical Decision Support system tailored for NCD management (e.g., hypertension, diabetes). Clinical rules live in a Drools rules engine; patient and visit data are stored in Postgres, exposed via a FastAPI backend. A React frontend provides the clinician-facing UI, including generating, reviewing, and acting on CDS recommendations.

---

**High-level architecture**
- Frontend: React (Vite) application served by Nginx in Docker image. It communicates with backend REST endpoints.
- Backend: FastAPI application (ASGI via Uvicorn) implementing REST API routes, orchestrating Drools evaluations, persisting CDS recommendations, prescriptions, test requests, etc.
- Database: PostgreSQL for persistence. Async SQLAlchemy (via asyncpg) used for DB interactions. Alembic used for migrations.
- Rules engine: A Java Spring Boot project using Drools. Built into a fat JAR (`clinical-cds-drools-1.0.0.jar`) and executed by the backend (java -jar) with JSON file in/out.
- Orchestration: `docker-compose.yml` defines `postgres`, `adminer`, `backend`, and `frontend` services for local/integration testing.

---

**Component-level details**

Backend (FastAPI)
- Location: `backend/app` (entry: `backend/app/main.py`).
- App config: FastAPI instance created in `app/main.py` with CORS middleware allowing "*" origins (development only).
- Routers included: `cds_routes`, `patient`, `visit`, `test_result`, `prescription`, `appointment`, `recommendation` (see `main.py` includes with prefixes).
- Health endpoints:
  - `/` root: returns high-level API status JSON.
  - `GET /health/db`: checks DB connectivity, returns database connection information, patient counts and recent patients. Uses an async SQLAlchemy `AsyncSession` from `database.session.get_db`.
  - `GET /api/v1/cds/health`: lightweight CDS health check.
- CDS API: `POST /api/v1/cds/evaluate` expects `CDSRequest` (contains nested `patient_data` and `visit_id`), forwards patient data to Drools, and persists recommendations by calling `cds_recommendation_service.save_recommendations(...)`.
  - `POST /api/v1/cds/evaluate-direct` accepts a `PatientData` object directly (bypassing wrapper) and returns `CDSResponse`.
- DB session: `backend/database/session.py` defines `DATABASE_URL` (env override supported) and `engine` built with `create_async_engine`. Parameters: `echo=True` (development), `pool_pre_ping=True`, `pool_size=5`, `max_overflow=10`. An async sessionmaker is exported and used as a FastAPI dependency `get_db()` which yields sessions and handles rollback on unexpected exceptions.
- Models & persistence: SQLAlchemy models are under `backend/database/models` (e.g., `patient.py`, `prescription.py`, `visit.py`, `cds_recommendation.py`, `test_result.py`). Pydantic schemas live under `backend/app/schemas`. CRUD operations and business logic are under `backend/app/crud` and services under `backend/app/services` (e.g., `cds_recommendation_service.py`, `drools_integration.py`).

Drools integration service (backend side)
- Location: `backend/app/services/drools_integration.py`.
- Responsibilities:
  - Convert Python/Pydantic `PatientData` into Java-friendly JSON structure (method `_convert_to_java_input`). This structure contains `demographics`, `consultation`, `medicalHistory`, `socialHistory`, `physicalExamination`, optional `investigations`, and optional `history` for previous visits.
  - Launch the Drools JAR using `subprocess.run` with `java -jar {jar} {input.json} {output.json}`.
  - Read the JSON output file, convert it into `ClinicalDecision` objects (`_convert_from_java_output`), and return a `CDSResponse` wrapper including `execution_time_ms`.
  - The service writes temporary input and output files (using `tempfile.NamedTemporaryFile`) and ensures cleanup in `finally`.
  - Timeout on Java call: 30 seconds (configurable by code change).
  - Error handling: non-zero Java return code or JSON parse errors are captured and returned as a failed `CDSResponse`.
  - Jar discovery: attempts relative paths `../drools-engine/target/clinical-cds-drools-1.0.0.jar`, `./drools-engine/target/...`, or `clinical-cds-drools-1.0.0.jar`; raises `FileNotFoundError` if not found.
  - Utilities: `test_connection()` builds a sample patient and attempts an evaluation, returning boolean success.

Rules engine (Drools Java project)
- Location: `drools-engine/`.
- Build system: Maven (`pom.xml`). Parent is Spring Boot starter parent (version `2.7.18`), plugin `spring-boot-maven-plugin` configured with `mainClass` set to `com.rwanda.health.cds.DroolsJsonRunner` (this is the Java entrypoint expected to accept two args: input JSON file and output JSON file).
- Dependencies: Drools modules (`drools-core`, `drools-compiler`, `drools-decisiontables`, etc.), `kie-api`, Jackson for JSON.
- Output artifact: a fat JAR named `clinical-cds-drools-1.0.0.jar` produced by the Maven package/repackage steps. Docker build stage copies this JAR into the backend image.

Database (Postgres + Alembic)
- Docker image specified in `docker-compose.yml`: `postgres:15`.
- Default credentials in compose:
  - DB: `clinical_cds`
  - USER: `auda`
  - PASSWORD: `N1saw2Auda`
- Connection string example (used in development docker-compose): `postgresql+asyncpg://auda:N1saw2Auda@postgres:5432/clinical_cds`
- Migrations live in `backend/alembic/versions/` and `backend/alembic.ini` controls Alembic configuration. Several migrations are already committed (see `versions/*`).

Frontend (React + Vite)
- Location: `frontend/`, entry `frontend/src/main.jsx` and `frontend/src/App.jsx`.
- Build system: Vite. `package.json` includes `dev`, `build`, `preview` scripts. Uses React 18 and React Router v6.
- Styling: Tailwind CSS configured via `tailwind.config.js`.
- Key UI components:
  - `Dashboard` (entry for main app views)
  - `CDSRecommendationsList.jsx` (detailed logic; handles deduplication, selection, local persistence, create-prescription and create-tests actions). Important behaviors:
    - API base: reads `VITE_API_URL` from environment at build time; falls back to `http://localhost:8000`.
    - Stores per-visit selection state in `localStorage` using key `cds_selections_${visit.id}`. Stores `selectedMeds`, `selectedTests`, `processedMeds`, `processedTests`.
    - Deduplicates recommendations returned by backend using JSON key including `risk`, `notes`, meds, tests and `source`.
    - Allows selecting recommended medications and tests. Selected medications trigger POST requests to `POST ${API_BASE_URL}/prescriptions` to create prescriptions (payload includes `visit_id`, `medication`, `dose`, `frequency`, `status: 'DRAFT'`, `source: 'AI_CDS'`).
    - Allows bulk test creation via `POST ${API_BASE_URL}/test-results/bulk` with an array of test result objects.
    - Enforces urgent tests selection: urgent tests (detected by the presence of "urgent" in test name) must be selected together.
    - Visual indicators for created/ordered items and processed flags prevent re-creation.
    - Health check: `App.jsx` calls `healthCheck()` (service in `frontend/src/services/api`) and shows a colored dot indicating backend `healthy|unhealthy|offline`.
- Production packaging: `frontend/Dockerfile` builds with Node, produces static `dist` files, then serves via `nginx:alpine`. `frontend/nginx.conf` provides an API proxy so the same origin can forward API calls to the backend.

End-to-end data flow (detailed sequence)
1. Clinician uses the web UI in browser (served by Nginx or `vite` during dev).
2. The clinician opens a patient visit form or dashboard. The UI reads patient and visit objects (likely from backend endpoints under `/patients`, `/visits`).
3. The user requests a CDS evaluation (button / action): the frontend gathers `PatientData` and posts to `POST /api/v1/cds/evaluate` (payload `CDSRequest` that contains `patient_data` nested and `visit_id`).
4. FastAPI `cds_routes.evaluate_patient` receives the request. It calls `drools_service.evaluate_patient(patient_data)`.
5. `DroolsIntegrationService.evaluate_patient`:
   - Serializes the Pydantic `PatientData` to a JSON file with the precise structure expected by the Drools runner.
   - Calls the Drools JAR with `subprocess.run(['java', '-jar', drools_jar_path, input.json, output.json])`.
   - Reads `output.json` and marshals results to `ClinicalDecision` objects and wraps them in `CDSResponse`.
6. `cds_routes.evaluate_patient` receives the `CDSResponse`. It persists recommendations by invoking `cds_recommendation_service.save_recommendations(db, patient_id, visit_id, decisions, ...)` and returns the `CDSResponse` to the frontend.
7. The frontend displays returned recommendations via `CDSRecommendationsList` and allows the clinician to select meds/tests. When the clinician chooses to create prescriptions, the component posts to `/prescriptions` for each med; for tests it posts a bulk to `/test-results/bulk`.
8. The backend endpoints receiving these orders persist them in the database and return appropriate HTTP responses; the UI updates processed state in localStorage and provides visual feedback.

API endpoints (not exhaustive — primary ones observed in code):
- `GET /` - root status
- `GET /health/db` - database connectivity and quick diagnostics
- `GET /api/v1/cds/health` - CDS health
- `POST /api/v1/cds/evaluate` - Evaluate nested `CDSRequest` (saves recommendations)
- `POST /api/v1/cds/evaluate-direct` - Evaluate `PatientData` directly
- `POST /prescriptions` - Create prescription (called from frontend)
- `POST /test-results/bulk` - Create multiple test result records
- Additional routers: `/patients`, `/visits`, `/appointments`, `/recommendations`, `/test-results`, `/prescriptions` (see `backend/app/routes/*` for details)

Important files and their purpose
- `backend/app/main.py` — FastAPI application instantiation and router mounting.
- `backend/database/session.py` — Async DB engine & `get_db()` dependency.
- `backend/app/services/drools_integration.py` — Drools runner bridge (JSON in/out, subprocess java -jar invocation).
- `backend/app/routes/cds_routes.py` — CDS-specific REST endpoints and persistence hook for recommendations.
- `backend/app/services/cds_recommendation_service.py` — logic to save and manage recommendations (persist and link to visits/patients).
- `backend/database/models/*.py` — SQLAlchemy models (Patient, Visit, Prescription, TestResult, CDSRecommendation, etc.).
- `backend/alembic/` — migration scripts for DB schema.
- `drools-engine/pom.xml` — Java build and dependencies for Drools rules engine.
- `drools-engine/src` — Java source (rules runner, JSON mapping, rule files, decision tables).
- `backend/Dockerfile` — multi-stage build that compiles the Drools jar (using Maven image) then builds a Python runtime image and copies the jar into the backend container so the backend can call it.
- `docker-compose.yml` — local orchestration for DB, adminer, backend, frontend.
- `frontend/src/components/CDSRecommendationsList.jsx` — UI component that shows recommendations and implements create-prescription and create-tests interactions.

Build & run

Development (local using Python/Node)
- Backend (local):
  - Create a Python venv and install requirements from `backend/requirements.txt`.
  - Ensure `DATABASE_URL` points at a running Postgres instance (local or Docker). Example for local Postgres: `postgresql+asyncpg://auda:N1saw2Auda@localhost:5432/clinical_cds`.
  - Run migrations with Alembic if schema not present: `alembic upgrade head` (from `backend` directory using `alembic.ini`).
  - Start backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.

- Frontend (dev server):
  - From `frontend` run `npm ci` then `npm run dev` to start Vite.

Docker-based (recommended for parity)
- Build and run everything via Docker Compose from repository root:

```sh
docker compose up --build
```

This `docker-compose.yml` will:
  - Start a Postgres database `cds_postgres` (ports mapped 5432:5432, volume `postgres_data`).
  - Start `cds_adminer` for DB browsing at port 8080.
  - Build the backend image using `backend/Dockerfile` which itself runs a Maven build to create the Drools jar in a build stage and copies it into the final Python image. The final backend listens on port 8000.
  - Build and serve the frontend (static) with Nginx on port 80.

Notes about the backend Dockerfile and Drools build:
- Dockerfile uses a multi-stage build. Stage 1: `maven:3.9.9-eclipse-temurin-11` builds the Drools JAR using `mvn -f drools-engine/pom.xml package -DskipTests`.
- Stage 2: `python:3.12-slim` installs `default-jre-headless` to provide `java` at runtime, installs Python requirements and copies the pre-built JAR into `./drools-engine/target/clinical-cds-drools-1.0.0.jar` where `DroolsIntegrationService` expects to find it.

Operational considerations & environment variables
- `DATABASE_URL` — critical for DB connection. Default in `session.py` uses `postgresql+asyncpg://auda:N1saw2Auda@localhost:5432/clinical_cds` but `docker-compose.yml` sets it to `postgresql+asyncpg://auda:N1saw2Auda@postgres:5432/clinical_cds` for container networking.
- `PYTHONUNBUFFERED=1` set in Dockerfile to avoid buffered logs.
- `VITE_API_URL` — frontend build-time env variable to set the backend API base for the static build. Alternatively, configure Nginx proxy in `frontend/nginx.conf` to forward API calls.
- CORS is currently open in `app/main.py` (`allow_origins=["*"]`) — this is convenient for development but must be restricted in production to known frontend origins.

Troubleshooting checklist (common failure points and fixes)
- Drools JAR not found: Backend/DroolsIntegrationService searches relative paths. If building locally, ensure `mvn -f drools-engine/pom.xml package` completed and the JAR path matches `drools-engine/target/clinical-cds-drools-1.0.0.jar`. When running via Docker Compose the Dockerfile builds and copies the JAR into the backend image.
- Java runtime missing in container: `default-jre-headless` is installed in the backend image by the Dockerfile. If running backend locally in a venv, ensure `java` is installed and on PATH (Java 11 or higher recommended as configured in `pom.xml`).
- DB connection failures: Verify `DATABASE_URL` and check `docker compose ps` to confirm Postgres is healthy. `GET /health/db` returns diagnostic info. If using a local DB, ensure the correct host/port and that asyncpg is supported.
- Alembic/migration errors: Run `alembic current` and `alembic upgrade head` from `backend` when the database schema is missing or behind.
- Timeout calling Drools JAR: Default 30s. Increase `timeout` in `drools_integration.evaluate_patient()` if needed or investigate performance of rules.

Production hardening and scaling notes (recommendations)
- Lock down CORS by setting `allow_origins` to the production frontend domain(s) and disable `allow_origins=["*"]`.
- Do not keep `echo=True` for SQLAlchemy engine in production; set to `False` to avoid verbose SQL logs.
- Use a secrets manager (Azure Key Vault / AWS Secrets Manager / environment injection) for `DATABASE_URL` and other secrets rather than baking them into compose files.
- Use a dedicated Java runtime image and a CI job to build Drools artifact separately, pushing the artifact to an artifact registry or storing the jar in an immutable image rather than building inside the backend Dockerfile on every backend build.
- Introduce a task queue (e.g., Celery, RQ) if Drools evaluations are long-running and you want asynchronous processing instead of blocking HTTP handlers.
- Add monitoring / metrics (Prometheus exporters, request latency histograms). Record Drools execution time (`execution_time_ms` in responses) and surface slow rules evaluations.
- Consider rate limiting and authentication (JWT / OAuth2: FastAPI supports OAuth2 flows) for production.

Scaling considerations
- Stateless backend instances are possible if Drools JAR invocation is available to each instance. If the JAR is large or expensive to run, consider a dedicated rules evaluation microservice (Java-based) exposing a gRPC/HTTP API and running in a horizontally scalable deployment (Kubernetes).
- Database: scale Postgres vertically or use read replicas for read-heavy workloads. Move long-running writes/offloads to background jobs if needed.

Data model highlights (what the rules expect)
- The `PatientData` object passed into the Drools engine combines:
  - `demographics` (patientId, upid, fullName, gender, age, address fields)
  - `consultation` (practitionerName, consultationType, chiefComplaint)
  - `medicalHistory` (hypertension, diabetes, CKD, CAD, medications, allergies, pregnancy, and many diabetes-specific details)
  - `socialHistory` (tobacco, alcohol)
  - `physicalExamination` (systole, diastole, BP classification, height/weight/BMI, pulse, spO2)
  - `investigations` (hba1c, fasting/random glucose, egfr, LDL, urine protein, creatinine)
  - optional `history` fields for comparison with previous visits (previous systole/diastole/visit date)
- The Drools output JSON uses a `decisions` array of objects: fields include `diagnosis`, `stage`, `medications`, `tests`, `patientAdvice`, `needsReferral`, `referralReason`, `confidenceLevel`. The backend maps these fields into `ClinicalDecision` model.

Security and privacy notes
- The system stores sensitive patient health information. Ensure transport encryption (TLS for frontend → backend and backend → DB via SSL) in production.
- Use role-based access control for clinical actions (who may create prescriptions, sign orders) — this codebase does not appear to include an authentication layer by default; add an auth scheme before deploying to production.

Developer expectations and conventions
- Code style: follow existing project's structure. Avoid changing API shapes without migrating stored records.
- Tests: There are no visible automated test suites included in the repository. Add unit tests for the backend services (`drools_integration`), route handlers, and JS component tests for critical UI logic (selection, storage) if needed.

Troubleshooting quick commands
- Build Drools jar locally (if not using Docker):
```sh
cd drools-engine
mvn -f pom.xml package -DskipTests
```
- Run the backend locally (after ensuring `DATABASE_URL` points to a reachable Postgres):
```sh
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Run with Docker Compose (recommended):
```sh
docker compose up --build
```

Contributing and next steps
- If you are adding new rules, update `drools-engine/src` and create tests for the rule outcomes. Rebuild the JAR and ensure the backend can find it.
- Add authentication prior to real-data deployments. Consider integrating a test patient generation utility for end-to-end acceptance tests.

Contact and support
- For questions about the clinical content or rules logic, consult whoever manages the Drools rules (`drools-engine` source) — the rules are clinical artifacts and require clinical governance for changes.

---

This README is intentionally thorough to help a developer or clinical informatician understand the full end-to-end system behavior and where pieces live. If you'd like, I can:
- Add a concise developer quick-start with exact commands for Windows and Linux.
- Produce sequence diagrams (PlantUML) for the Drools invocation flow.
- Generate a smaller "ops" README with only run/build commands and health-checks.
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