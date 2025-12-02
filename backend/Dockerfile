FROM maven:3.9.9-eclipse-temurin-11 AS drools-builder

WORKDIR /app

# Copy Drools engine project and build the fat JAR
COPY drools-engine/pom.xml ./drools-engine/pom.xml
COPY drools-engine/src ./drools-engine/src

RUN mvn -q -f drools-engine/pom.xml package -DskipTests


FROM python:3.12-slim AS backend

WORKDIR /app

# Install Java runtime for Drools JAR execution
# Use default-jre-headless (Debian provides current supported JRE, typically 17)
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/app ./app
COPY backend/database ./database

# Copy alembic configuration and migration scripts so alembic CLI has its config inside the image
COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic

# Copy built Drools JAR into expected location
RUN mkdir -p ./drools-engine/target
COPY --from=drools-builder /app/drools-engine/target/clinical-cds-drools-1.0.0.jar ./drools-engine/target/clinical-cds-drools-1.0.0.jar

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


