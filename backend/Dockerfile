FROM maven:3.9.9-eclipse-temurin-11 AS drools-builder

WORKDIR /app

# Copy Drools engine project and build the fat JAR
COPY drools-engine/pom.xml ./drools-engine/pom.xml
COPY drools-engine/src ./drools-engine/src

RUN mvn -q -f drools-engine/pom.xml package -DskipTests


FROM python:3.12-slim AS backend

WORKDIR /app

# Install Java runtime for Drools JAR execution
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Install CPU-only torch first to avoid downloading the massive CUDA build (~916MB → ~250MB)
RUN pip install --no-cache-dir --timeout=600 \
    torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements without sentence-transformers
COPY backend/requirements.txt ./requirements.txt

# Install all other dependencies first
RUN pip install --no-cache-dir --timeout=600 -r requirements.txt

# Install sentence-transformers separately without reinstalling torch
# sentence-transformers requires its own Python deps (e.g. `transformers`).
# Without deps, llm_service crashes at import-time and AI explanations never start.
RUN pip install --no-cache-dir sentence-transformers

# Copy backend application code
COPY backend/app ./app
COPY backend/database ./database
COPY backend/llm_service.py ./llm_service.py

# Copy alembic configuration and migration scripts
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic

# Copy built Drools JAR into expected location
RUN mkdir -p ./drools-engine/target
COPY --from=drools-builder /app/drools-engine/target/clinical-cds-drools-1.0.0.jar ./drools-engine/target/clinical-cds-drools-1.0.0.jar

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]