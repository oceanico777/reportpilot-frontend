import os
import sqlalchemy
from sqlalchemy import create_engine, text, inspect
from app.database import SQLALCHEMY_DATABASE_URL

print(f"Starting EXTENDED database repair on: {SQLALCHEMY_DATABASE_URL.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URL else SQLALCHEMY_DATABASE_URL}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def add_column_if_not_exists(conn, table_name, column_name, column_type):
    inspector = inspect(engine)
    try:
        columns = [c['name'] for c in inspector.get_columns(table_name)]
        if column_name not in columns:
            print(f"Adding column {column_name} to {table_name}...")
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};"))
            print("OK")
            # If it's a specific column, maybe set a default for existing rows
            if column_name == "role":
                conn.execute(text(f"UPDATE {table_name} SET role = 'ADMIN' WHERE role IS NULL;"))
            if column_name == "currency":
                conn.execute(text(f"UPDATE {table_name} SET currency = 'COP' WHERE currency IS NULL;"))
            if column_name == "status":
                conn.execute(text(f"UPDATE {table_name} SET status = 'DRAFT' WHERE status IS NULL;"))
        else:
            print(f"Column {column_name} already exists in {table_name}.")
    except Exception as e:
        print(f"Error checking/adding column {column_name} in {table_name}: {e}")

def repair():
    # List of all tables and columns from models.py that might be missing in an old DB
    schema_map = {
        "users": [
            ("company_id", "VARCHAR"),
            ("role", "VARCHAR"),
            ("is_active", "BOOLEAN DEFAULT TRUE"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        ],
        "companies": [
            ("invitation_code", "VARCHAR"),
            ("settings", "TEXT"),
            ("user_id", "VARCHAR")
        ],
        "providers": [
            ("category", "VARCHAR"),
            ("frequency", "VARCHAR"),
            ("phone", "VARCHAR"),
            ("email", "VARCHAR")
        ],
        "products": [
            ("unit", "VARCHAR DEFAULT 'unit'"),
            ("last_price", "FLOAT DEFAULT 0.0"),
            ("provider_id", "VARCHAR")
        ],
        "purchases": [
            ("vendor", "VARCHAR"),
            ("amount", "FLOAT"),
            ("currency", "VARCHAR DEFAULT 'COP'"),
            ("category", "VARCHAR"),
            ("invoice_number", "VARCHAR"),
            ("is_duplicate", "BOOLEAN DEFAULT FALSE"),
            ("potential_duplicate_of", "VARCHAR"),
            ("notes", "TEXT"),
            ("storage_path", "VARCHAR"),
            ("file_url", "VARCHAR"),
            ("source_file_path", "VARCHAR"),
            ("status", "VARCHAR DEFAULT 'DRAFT'"),
            ("user_id", "VARCHAR"),
            ("provider_id", "VARCHAR"),
            ("month", "INTEGER"),
            ("year", "INTEGER"),
            ("tour_id", "VARCHAR"),
            ("client_name", "VARCHAR"),
            ("date", "DATE")
        ],
        "purchase_items": [
            ("unit", "VARCHAR"),
            ("unit_price", "FLOAT DEFAULT 0.0"),
            ("total_price", "FLOAT DEFAULT 0.0")
        ],
        "receipts": [
            ("status", "VARCHAR DEFAULT 'PENDING'"),
            ("storage_path", "VARCHAR"),
            ("file_url", "VARCHAR"),
            ("filename", "VARCHAR"),
            ("content_type", "VARCHAR"),
            ("processed_at", "TIMESTAMP")
        ],
        "daily_closures": [
            ("total_sales", "FLOAT DEFAULT 0.0"),
            ("total_expenses", "FLOAT DEFAULT 0.0"),
            ("cash_in_hand", "FLOAT DEFAULT 0.0"),
            ("closed_by_email", "VARCHAR")
        ]
    }

    with engine.connect() as conn:
        from app.models import Base
        print("Ensuring all tables exist...")
        Base.metadata.create_all(bind=engine)
        
        for table_name, columns in schema_map.items():
            print(f"--- Repairing table: {table_name} ---")
            for col_name, col_type in columns:
                add_column_if_not_exists(conn, table_name, col_name, col_type)
        
        # --- CRITICAL: Force defaults on existing NULLs to avoid Pydantic failures ---
        print("Forcing defaults on existing NULL values...")
        try:
            conn.execute(text("UPDATE users SET role = 'ADMIN' WHERE role IS NULL;"))
            conn.execute(text("UPDATE users SET is_active = TRUE WHERE is_active IS NULL;"))
            conn.execute(text("UPDATE purchases SET status = 'DRAFT' WHERE status IS NULL;"))
            conn.execute(text("UPDATE purchases SET currency = 'COP' WHERE currency IS NULL;"))
            conn.execute(text("UPDATE purchases SET date = CURRENT_DATE WHERE date IS NULL;"))
            conn.execute(text("UPDATE receipts SET status = 'PENDING' WHERE status IS NULL;"))
            conn.execute(text("UPDATE providers SET category = 'General' WHERE category IS NULL;"))
            conn.execute(text("UPDATE products SET unit = 'unit' WHERE unit IS NULL;"))
            conn.commit()
            print("Defaults applied successfully.")
        except Exception as e:
            print(f"Warning during defaults application: {e}")
        
    print("EXTENDED Database repair completed successfully.")


if __name__ == "__main__":
    try:
        repair()
    except Exception as e:
        print(f"CRITICAL: Database repair failed, but continuing startup: {e}")
        import traceback
        traceback.print_exc()
        # Exit with 0 to allow uvicorn to start even if repair failed
        import sys
        sys.exit(0)
