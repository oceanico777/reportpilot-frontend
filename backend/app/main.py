from fastapi import FastAPI, Request
from .database import engine, Base
from .routers import receipts, purchases, auth, exports, users, budgets, closures, providers, products, recipes, reports
import time
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from .services.logging_config import setup_logging

# Setup Logging
logger = setup_logging()

# Setup Sentry
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "development")
    )

# Create tables
Base.metadata.create_all(bind=engine)

import os
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app = FastAPI(
    title="ReportPilot AI API",
    description="""
    ## 🚀 Automated Receipt Processing & Reporting API
    
    ### Features
    - 📸 OCR receipt processing with Google Gemini AI
    - 📊 Automated expense report generation
    - 🔐 Multi-tenant with company-level isolation
    - 📁 Secure file storage with Supabase
    
    ### Authentication
    All endpoints (except `/health`) require Bearer token authentication.
    Use your Supabase JWT token in the Authorization header.
    """,
    version="2.0.1",
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.middleware.cors import CORSMiddleware


from fastapi.staticfiles import StaticFiles

# CORS configuration - More permissive for debugging
origins = ["*"]

logger.info("CORS configured to allow all origins [*]")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False, # authorization header doesn't require this, and '*' needs it False
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file access
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Request logging handled by setup_logging or uvicorn

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(receipts.router, prefix="/receipts", tags=["Receipts"])
app.include_router(purchases.router, tags=["Purchases"])
app.include_router(products.router, tags=["Products"]) # NEW
app.include_router(recipes.router, tags=["Recipes"]) # NEW
app.include_router(providers.router, tags=["Providers"])
app.include_router(exports.router, tags=["Exports"])
app.include_router(users.router, tags=["Users"])
app.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
app.include_router(closures.router, tags=["Closures"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ReportPilot AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
