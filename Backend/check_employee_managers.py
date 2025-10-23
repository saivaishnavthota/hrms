#!/usr/bin/env python3
"""
Script to check if employee_managers table exists and has data
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def check_employee_managers():
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
        
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'employee_managers'
                );
            """)).fetchone()
            
            table_exists = result[0] if result else False
            print(f"Table 'employee_managers' exists: {table_exists}")
            
            if table_exists:
                # Check table structure
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = 'employee_managers'
                    ORDER BY ordinal_position;
                """)).fetchall()
                
                print("\nTable structure:")
                for row in result:
                    print(f"  {row[0]}: {row[1]} (nullable: {row[2]})")
                
                # Check if there's any data
                result = conn.execute(text("SELECT COUNT(*) FROM employee_managers")).fetchone()
                count = result[0] if result else 0
                print(f"\nNumber of records: {count}")
                
                if count > 0:
                    # Show sample data
                    result = conn.execute(text("SELECT * FROM employee_managers LIMIT 5")).fetchall()
                    print("\nSample data:")
                    for row in result:
                        print(f"  {row}")
                
                # Check if employee_id 11 has any managers
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM employee_managers 
                    WHERE employee_id = 11
                """)).fetchone()
                count_11 = result[0] if result else 0
                print(f"\nManagers for employee_id 11: {count_11}")
                
                if count_11 > 0:
                    result = conn.execute(text("""
                        SELECT em.*, u.name as manager_name, u.company_email 
                        FROM employee_managers em
                        JOIN employees u ON em.manager_id = u.id
                        WHERE em.employee_id = 11
                    """)).fetchall()
                    print("Manager details for employee 11:")
                    for row in result:
                        print(f"  Manager ID: {row[2]}, Name: {row[3]}, Email: {row[4]}")
            else:
                print("\nTable 'employee_managers' does not exist!")
                print("You may need to create it or run database migrations.")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_employee_managers()
