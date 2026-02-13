from fastapi import FastAPI, Request
from .database import engine, Base, get_db
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
    version="2.0.3",
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

# Global Exception Handler to ensure CORS headers even on 500 errors
@app.middleware("http")
async def add_cors_header_to_errors(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        from fastapi.responses import JSONResponse
        import traceback
        logger.error(f"Unhandled Exception: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(e)}", "type": str(type(e).__name__)},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            }
        )


# Mount uploads directory for static file access
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Request logging handled by setup_logging or uvicorn

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(receipts.router, prefix="/receipts", tags=["Receipts"])
app.include_router(purchases.router, prefix="/purchases", tags=["Purchases"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(recipes.router, prefix="/recipes", tags=["Recipes"])
app.include_router(providers.router, prefix="/providers", tags=["Providers"])
app.include_router(exports.router, prefix="/exports", tags=["Exports"])
app.include_router(users.router, tags=["Users"])
app.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
app.include_router(closures.router, prefix="/closures", tags=["Closures"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ReportPilot AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/debug/db")
def debug_db(db=Depends(get_db)):
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT current_database(), current_user;")).fetchone()
        return {"status": "connected", "db": result[0], "user": result[1]}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/debug/purchases")
def debug_purchases(db=Depends(get_db)):
    try:
        from sqlalchemy import text
        # Raw query to avoid Pydantic validation
        result = db.execute(text("SELECT * FROM purchases LIMIT 5;")).fetchall()
        columns = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'purchases';")).fetchall()
        col_names = [c[0] for c in columns]
        
        data = []
        for row in result:
            data.append(dict(zip(col_names, row)))
            
        return {"status": "ok", "count": len(data), "sample": data}
    except Exception as e:
        import traceback
        return {"status": "error", "error": str(e), "trace": traceback.format_exc()}
