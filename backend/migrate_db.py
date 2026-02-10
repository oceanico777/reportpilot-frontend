import sqlalchemy
from sqlalchemy import create_engine, text
from app.database import engine

print("Starting migration...")
# engine = create_engine(DATABASE_URL) # Already exists

commands = [
    "ALTER TABLE purchases ADD COLUMN vendor VARCHAR;",
    "ALTER TABLE purchases ADD COLUMN amount FLOAT;",
    "ALTER TABLE purchases ADD COLUMN currency VARCHAR;",
    "ALTER TABLE purchases ADD COLUMN category VARCHAR;"
]

with engine.connect() as conn:
    for cmd in commands:
        try:
            print(f"Executing: {cmd}")
            conn.execute(text(cmd))
            print("OK")
        except Exception as e:
            print(f"Error executing {cmd}: {e}")
            
    conn.commit()

print("Migration completed.")
