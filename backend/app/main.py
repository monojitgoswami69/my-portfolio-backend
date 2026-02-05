from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from .config import settings, logger
from .providers.database.firestore_init import initialize_firebase
from .utils.limiter import limiter
from .exceptions import AppException
from .routers import (
    auth_router,
    dashboard_router,
    system_instructions_router,
    projects_router,
    knowledge_router,
    health_router,
    chat_router,
    contacts_router
)

app = FastAPI(
    title="Portfolio Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Firebase...")
    initialize_firebase()
    logger.info("Firebase initialized successfully")


app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"status": "error", "message": "Rate limit exceeded. Please try again later."}
    )


# CORS configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-New-Token"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "details": str(exc.details) if exc.details else None
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"}
    )


# Include Routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(system_instructions_router)
app.include_router(projects_router)
app.include_router(knowledge_router)
app.include_router(health_router)
app.include_router(chat_router)  # Public chat endpoint (no auth)
app.include_router(contacts_router)


@app.get("/")
async def root():
    return {"message": "Portfolio Backend API", "version": "1.0.0"}
