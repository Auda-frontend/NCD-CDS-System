from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from .routes import cds_routes
from .routes import patient as patient_routes
from .routes import visit as visit_routes
from .routes import test_result as test_result_routes
from .routes import prescription as prescription_routes
from .routes import appointment as appointment_routes
from .routes import recommendation as recommendation_routes
from database.session import get_db, DATABASE_URL

# Create FastAPI application
app = FastAPI(
    title="Clinical Decision Support System API",
    description="AI-Assisted CDS for NCD Management in Rwanda - Hypertension Module",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cds_routes.router)
app.include_router(patient_routes.router, prefix="/patients", tags=["patients"])
app.include_router(visit_routes.router, prefix="/visits", tags=["visits"])
app.include_router(test_result_routes.router, prefix="/test-results", tags=["test_results"])
app.include_router(prescription_routes.router, prefix="/prescriptions", tags=["prescriptions"])
app.include_router(appointment_routes.router, prefix="/appointments", tags=["appointments"])
app.include_router(recommendation_routes.router, prefix="/cds-recommendations", tags=["cds_recommendations"])

@app.get("/")
async def root():
    return {
        "message": "Clinical Decision Support System API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs"
    }

@app.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    """Diagnostic endpoint to check database connection and verify data persistence"""
    try:
        # Test database connection
        result = await db.execute(text("SELECT 1"))
        connection_ok = result.scalar() == 1
        
        # Get database connection details
        db_name_result = await db.execute(text("SELECT current_database()"))
        db_name = db_name_result.scalar()
        
        db_user_result = await db.execute(text("SELECT current_user"))
        db_user = db_user_result.scalar()
        
        db_host_result = await db.execute(text("SELECT inet_server_addr()"))
        db_host = db_host_result.scalar() or "localhost"
        
        db_port_result = await db.execute(text("SELECT inet_server_port()"))
        db_port = db_port_result.scalar() or 5432
        
        # Count patients in database
        from database.models import Patient
        from sqlalchemy.future import select
        from sqlalchemy import func
        count_result = await db.execute(select(func.count(Patient.id)))
        patient_count = count_result.scalar()
        
        # Get recent patients
        recent_patients_result = await db.execute(
            select(Patient.id, Patient.full_name, Patient.created_at)
            .order_by(Patient.created_at.desc())
            .limit(5)
        )
        recent_patients = [
            {
                "id": str(p.id),
                "full_name": p.full_name,
                "created_at": str(p.created_at)
            }
            for p in recent_patients_result.scalars().all()
        ]
        
        # Parse DATABASE_URL for display
        db_url_parts = DATABASE_URL.replace("postgresql+asyncpg://", "").split("@")
        db_url_display = db_url_parts[-1] if len(db_url_parts) > 1 else "hidden"
        
        return {
            "database_connection": "ok" if connection_ok else "failed",
            "database_name": db_name,
            "database_user": db_user,
            "database_host": db_host,
            "database_port": db_port,
            "database_url": db_url_display,
            "patient_count": patient_count,
            "recent_patients": recent_patients,
            "connection_info": {
                "app_connects_to": "Docker container 'postgres' (if running in Docker) or 'localhost' (if running locally)",
                "psql_command": f"psql -h localhost -p 5432 -U {db_user} -d {db_name}",
                "docker_command": "docker exec -it cds_postgres psql -U auda -d clinical_cds"
            },
            "status": "healthy"
        }
    except Exception as e:
        return {
            "database_connection": "failed",
            "error": str(e),
            "database_url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else "hidden",
            "status": "unhealthy"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)