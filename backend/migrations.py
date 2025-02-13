from sqlalchemy import create_engine
from models import Base
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get database URL from environment
database_url = os.getenv("DATABASE_URL")

def create_tables():
    # Create SQLAlchemy engine
    engine = create_engine(database_url)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    create_tables()
    print("Database tables created successfully!")
