#!/usr/bin/env python3
"""
Simple script to execute SQL for assigning In house project to all employees
This script connects directly to the database and runs the SQL
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_sql():
    """Execute the SQL script to assign In-House Project to all employees"""
    
    # Database connection parameters
    db_params = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'hrms'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }
    
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(**db_params)
        cursor = conn.cursor()
        
        print("📄 Reading SQL script...")
        with open('scripts/assign_inhouse_project.sql', 'r') as file:
            sql_script = file.read()
        
        print("🚀 Executing SQL script...")
        cursor.execute(sql_script)
        
        print("💾 Committing changes...")
        conn.commit()
        
        print("✅ Successfully executed SQL script!")
        print("🏠 In-House Project should now be available for all employees")
        
    except Exception as e:
        print(f"❌ Error executing SQL: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
        print("🔌 Database connection closed")

if __name__ == "__main__":
    execute_sql()
