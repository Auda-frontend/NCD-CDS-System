from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import cds_routes

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

@app.get("/")
async def root():
    return {
        "message": "Clinical Decision Support System API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)