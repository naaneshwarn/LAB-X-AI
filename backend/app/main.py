"""LabXAI FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_v1_router
from app.core.config import get_settings
from app.database.init_db import init_db
from app.database.session import check_db_connection

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize SQLite schema and baseline seed records non-destructively."""
    init_db()
    yield


app = FastAPI(
    title="LabXAI API",
    description="AI-powered Interactive Virtual Science Laboratory",
    version="1.0.0",
    lifespan=lifespan,
)

# Restrict CORS to configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
    """Return safe JSON errors without leaking internal stack traces."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


@app.get("/")
async def root():
    return {
        "project": "LabXAI",
        "message": "Welcome to LabXAI Backend",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    db_connected = check_db_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "LabXAI Backend",
        "database": "connected" if db_connected else "disconnected",
        "ai_engine": "configured" if settings.is_openrouter_configured else "fallback_only",
    }


@app.get("/api/v1")
async def api_information():
    return {
        "api": "LabXAI",
        "version": "v1",
        "available_modules": [
            "AI Engine",
            "Virtual Experiments",
            "Multilingual Support",
            "Learning Management",
        ],
    }


app.include_router(api_v1_router)
