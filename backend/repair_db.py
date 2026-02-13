import os
import sqlalchemy
from sqlalchemy import create_engine, text, inspect
from app.database import SQLALCHEMY_DATABASE_URL

print(f"Starting database repair on: {SQLALCHEMY_DATABASE_URL.split('@')[-1] if '@' in SQLALCHEMY_DATABASE_URL else SQLALCHEMY_DATABASE_URL}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

def add_column_if_not_exists(conn, table_name, column_name, column_type):
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns(table_name)]
    if column_name not in columns:
        print(f"Adding column {column_name} to {table_name}...")
        try:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};"))
            print("OK")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print(f"Column {column_name} already exists in {table_name}.")

def repair():
    tables_to_repair = {
        "users": [
            ("company_id", "VARCHAR"),
            ("role", "VARCHAR"),
            ("is_active", "BOOLEAN DEFAULT TRUE")
        ],
        "companies": [
            ("invitation_code", "VARCHAR")
        ],
        "purchases": [
            ("vendor", "VARCHAR"),
            ("amount", "FLOAT"),
            ("currency", "VARCHAR"),
            ("category", "VARCHAR"),
            ("invoice_number", "VARCHAR"),
            ("is_duplicate", "BOOLEAN DEFAULT FALSE"),
            ("potential_duplicate_of", "VARCHAR"),
            ("notes", "TEXT"),
            ("storage_path", "VARCHAR"),
            ("file_url", "VARCHAR"),
            ("source_file_path", "VARCHAR"),
            ("status", "VARCHAR"),
            ("user_id", "VARCHAR"),
            ("provider_id", "VARCHAR"),
            ("month", "INTEGER"),
            ("year", "INTEGER"),
            ("tour_id", "VARCHAR"),
            ("client_name", "VARCHAR")
        ]
    }

    with engine.connect() as conn:
        # 1. First, ensure all tables exist by calling create_all (safe)
        from app.models import Base
        print("Ensuring all tables exist...")
        Base.metadata.create_all(bind=engine)
        
        # 2. Check for specific missing columns in key tables
        for table_name, columns in tables_to_repair.items():
            print(f"Repairing table: {table_name}")
            for col_name, col_type in columns:
                add_column_if_not_exists(conn, table_name, col_name, col_type)
        
        conn.commit()
    print("Database repair completed successfully.")

if __name__ == "__main__":
    repair()
