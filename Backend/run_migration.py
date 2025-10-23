#!/usr/bin/env python3
"""
Simple script to run the database migration for adding project_name_commercial and account columns
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def run_migration():
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("Error: DATABASE_URL not found in environment variables")
        sys.exit(1)
    
    try:
        # Create engine
        engine = create_engine(database_url)
        
        # Run migration
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            try:
                # Add project_name_commercial column
                conn.execute(text("""
                    ALTER TABLE projects 
                    ADD COLUMN IF NOT EXISTS project_name_commercial VARCHAR(100)
                """))
                
                # Add account column
                conn.execute(text("""
                    ALTER TABLE projects 
                    ADD COLUMN IF NOT EXISTS account VARCHAR(100)
                """))
                
                # Commit transaction
                trans.commit()
                print("✅ Migration completed successfully!")
                print("Added columns: project_name_commercial, account")
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                print(f"❌ Migration failed: {e}")
                sys.exit(1)
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
