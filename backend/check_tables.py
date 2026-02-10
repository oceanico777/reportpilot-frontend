from sqlalchemy import create_engine, inspect
from app.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Tables in database: {tables}")
