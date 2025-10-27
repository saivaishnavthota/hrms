import pandas as pd
import re
from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from fuzzywuzzy import fuzz
from models.user_model import User
from models.employee_details_model import Location
import logging
import traceback

logger = logging.getLogger(__name__)

class EmployeeImportService:
    
    @staticmethod
    def find_or_create_location(location_name: str, session: Session) -> Optional[int]:
        """
        Find existing location or create new one
        Returns location_id or None if location_name is empty or "Not Found"
        """
        logger.info(f"=== find_or_create_location called with: '{location_name}' ===")
        
        if not location_name or not location_name.strip():
            logger.info("Location name is empty, returning None")
            return None
        
        location_name = location_name.strip()
        logger.info(f"Stripped location name: '{location_name}'")
        
        # Treat "Not Found" as empty location
        if location_name.lower() == "not found":
            logger.info(f"Location is 'Not Found', setting to None")
            return None
        
        try:
            # Try to find existing location with EXACT match first
            logger.info(f"Attempting exact match for location: '{location_name}'")
            result = session.query(Location).filter(Location.name == location_name).first()
            
            if result:
                logger.info(f"✓ Found existing location (exact match): {result.name} (ID: {result.id})")
                return result.id
            else:
                logger.info("No exact match found")
            
            # Try case-insensitive match
            logger.info(f"Attempting case-insensitive match for location: '{location_name}'")
            result = session.query(Location).filter(Location.name.ilike(location_name)).first()
            
            if result:
                logger.info(f"✓ Found existing location (case-insensitive): {result.name} (ID: {result.id})")
                return result.id
            else:
                logger.info("No case-insensitive match found")
            
            # Create new location only if it truly doesn't exist
            logger.info(f"Creating new location: '{location_name}'")
            new_location = Location(name=location_name)
            logger.info(f"Location object created: {new_location}")
            
            session.add(new_location)
            logger.info("Location added to session")
            
            session.flush()  # Get the ID
            logger.info(f"✓ Session flushed successfully. Created location: {new_location.name} with ID: {new_location.id}")
            return new_location.id
            
        except Exception as e:
            logger.error(f"✗ ERROR in find_or_create_location for '{location_name}'")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
            session.rollback()
            raise
    
    @staticmethod
    def find_employee_by_name_or_id(name: str, employee_id: str, company_email: str = None, session: Session = None) -> Optional[User]:
        """
        Try to find employee by name, company employee ID, or company email
        """
        logger.info(f"=== find_employee_by_name_or_id called with name='{name}', id='{employee_id}', email='{company_email}' ===")
        
        if not name and not employee_id and not company_email:
            logger.info(f"No name, employee_id, or company_email provided for lookup")
            return None
            
        # Strategy 1: Find by company email (most reliable)
        if company_email and company_email.strip():
            logger.info(f"Looking up employee by company email: {company_email.strip()}")
            try:
                result = session.query(User).filter(User.company_email == company_email.strip().lower()).first()
                if result:
                    logger.info(f"✓ Found existing employee by email: {result.name} (Email: {result.company_email})")
                    return result
                else:
                    logger.info(f"No employee found with email: {company_email.strip()}")
            except Exception as e:
                logger.error(f"✗ Error looking up employee by email: {e}")
                logger.error(f"Full traceback:\n{traceback.format_exc()}")
            
        # Strategy 2: Find by company employee ID
        if employee_id and employee_id.strip():
            logger.info(f"Looking up employee by ID: {employee_id.strip()}")
            try:
                result = session.query(User).filter(User.company_employee_id == employee_id.strip()).first()
                if result:
                    logger.info(f"✓ Found existing employee by ID: {result.name} (ID: {result.company_employee_id})")
                    return result
                else:
                    logger.info(f"No employee found with ID: {employee_id.strip()}")
            except Exception as e:
                logger.error(f"✗ Error looking up employee by ID: {e}")
                logger.error(f"Full traceback:\n{traceback.format_exc()}")
        
        # Strategy 3: Find by name (exact match)
        if name and name.strip():
            logger.info(f"Looking up employee by name: {name.strip()}")
            try:
                result = session.query(User).filter(User.name.ilike(f"%{name.strip()}%")).first()
                if result:
                    logger.info(f"✓ Found existing employee by name: {result.name} (ID: {result.company_employee_id})")
                    return result
                else:
                    logger.info(f"No employee found with name: {name.strip()}")
            except Exception as e:
                logger.error(f"✗ Error looking up employee by name: {e}")
                logger.error(f"Full traceback:\n{traceback.format_exc()}")
        
        logger.info(f"No existing employee found for name: {name}, ID: {employee_id}, email: {company_email}")
        return None

    @staticmethod
    def import_employees_from_excel(file_path: str, session: Session) -> Dict:
        """
        Import employees from Excel with format:
        - YTPL Emp ID: Company employee ID
        - Employee Full Name: Full name
        - Title: Job title/designation
        - Location: Employee location
        - Company Email: Company email address
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path, header=0)
            logger.info(f"========================================")
            logger.info(f"Read Excel file with {len(df)} rows and {len(df.columns)} columns")
            logger.info(f"Column names: {list(df.columns)}")
            logger.info(f"First 3 rows:\n{df.head(3)}")
            logger.info(f"========================================")
            
            # Validate required columns
            required_columns = ['YTPL Emp ID', 'Employee Full Name', 'Title', 'Location', 'Company Email']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "success": False,
                    "message": f"Missing required columns: {', '.join(missing_columns)}",
                    "imported": 0,
                    "errors": 0
                }
            
            imported_count = 0
            error_count = 0
            errors = []
            updated_count = 0
            
            # Process each row
            for index, row in df.iterrows():
                logger.info(f"\n{'='*60}")
                logger.info(f"PROCESSING ROW {index + 1}")
                logger.info(f"{'='*60}")
                
                try:
                    # Extract data
                    company_employee_id_raw = row['YTPL Emp ID'] if pd.notna(row['YTPL Emp ID']) else ""
                    full_name = str(row['Employee Full Name']).strip() if pd.notna(row['Employee Full Name']) else ""
                    title = str(row['Title']).strip() if pd.notna(row['Title']) else ""
                    location = str(row['Location']).strip() if pd.notna(row['Location']) else ""
                    company_email = str(row['Company Email']).strip() if pd.notna(row['Company Email']) else ""
                    
                    logger.info(f"Raw data extracted:")
                    logger.info(f"  - Name: '{full_name}'")
                    logger.info(f"  - ID (raw): '{company_employee_id_raw}'")
                    logger.info(f"  - Title: '{title}'")
                    logger.info(f"  - Location: '{location}'")
                    logger.info(f"  - Company Email: '{company_email}'")
                    
                    # Clean company_employee_id - ensure it's exactly 6 characters
                    if company_employee_id_raw:
                        company_employee_id = str(company_employee_id_raw).strip()
                        logger.info(f"Original employee ID: '{company_employee_id}'")
                        
                        # Remove .0 suffix if it's a numeric value with decimal
                        if company_employee_id.endswith('.0'):
                            company_employee_id = company_employee_id[:-2]
                            logger.info(f"After removing .0: '{company_employee_id}'")
                        
                        # Also handle cases where it might be a float representation
                        if '.' in company_employee_id:
                            # Split by decimal and take only the integer part
                            company_employee_id = company_employee_id.split('.')[0]
                            logger.info(f"After handling decimal: '{company_employee_id}'")
                        
                        # Ensure it's exactly 6 characters - pad with zeros if shorter, truncate if longer
                        if len(company_employee_id) < 6:
                            company_employee_id = company_employee_id.zfill(6)  # Pad with leading zeros
                            logger.info(f"After padding: '{company_employee_id}'")
                        elif len(company_employee_id) > 6:
                            company_employee_id = company_employee_id[:6]  # Truncate to 6 characters
                            logger.warning(f"Employee ID truncated to 6 characters: {company_employee_id}")
                        
                        # Validate that it's numeric (6-digit number)
                        if not company_employee_id.isdigit():
                            error_count += 1
                            error_msg = f"Row {index + 1}: Employee ID must be numeric (got: {company_employee_id})"
                            logger.error(f"✗ {error_msg}")
                            errors.append(error_msg)
                            continue
                        
                        logger.info(f"✓ Final employee ID: '{company_employee_id}' (length: {len(company_employee_id)})")
                    else:
                        company_employee_id = ""
                        logger.info("No employee ID provided")
                    
                    if not full_name:
                        error_count += 1
                        error_msg = f"Row {index + 1}: Employee name is required"
                        logger.error(f"✗ {error_msg}")
                        errors.append(error_msg)
                        continue
                    
                    # Validate company email format if provided
                    if company_email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', company_email):
                        error_count += 1
                        error_msg = f"Row {index + 1}: Invalid company email format: {company_email}"
                        logger.error(f"✗ {error_msg}")
                        errors.append(error_msg)
                        continue
                    
                    # Find or create location
                    logger.info(f"\n--- LOCATION LOOKUP/CREATE ---")
                    location_id = EmployeeImportService.find_or_create_location(location, session)
                    logger.info(f"✓ Location ID result: {location_id}")
                    
                    # Check if employee already exists
                    logger.info(f"\n--- EMPLOYEE LOOKUP ---")
                    existing_employee = EmployeeImportService.find_employee_by_name_or_id(
                        full_name, company_employee_id, company_email, session
                    )
                    
                    if existing_employee:
                        logger.info(f"Employee exists - checking for updates")
                        # Update existing employee
                        updated = False
                        
                        if company_employee_id and company_employee_id != existing_employee.company_employee_id:
                            logger.info(f"Updating company_employee_id: {existing_employee.company_employee_id} -> {company_employee_id}")
                            existing_employee.company_employee_id = company_employee_id
                            updated = True
                            
                        if title and title != existing_employee.designation:
                            logger.info(f"Updating designation: {existing_employee.designation} -> {title}")
                            existing_employee.designation = title
                            updated = True
                        
                        if location_id and location_id != existing_employee.location_id:
                            logger.info(f"Updating location_id: {existing_employee.location_id} -> {location_id}")
                            existing_employee.location_id = location_id
                            updated = True
                        
                        if company_email and company_email != existing_employee.company_email:
                            logger.info(f"Updating company_email: {existing_employee.company_email} -> {company_email}")
                            existing_employee.company_email = company_email
                            updated = True
                        
                        if updated:
                            session.add(existing_employee)
                            updated_count += 1
                            logger.info(f"✓ Updated employee: {full_name}")
                        else:
                            logger.info(f"Employee {full_name} already exists, no changes needed")
                    else:
                        # Create new employee
                        logger.info(f"\n--- CREATING NEW EMPLOYEE ---")
                        logger.info(f"Employee data:")
                        logger.info(f"  - name: {full_name}")
                        logger.info(f"  - company_employee_id: {company_employee_id if company_employee_id else None}")
                        logger.info(f"  - designation: {title if title else None}")
                        logger.info(f"  - location_id: {location_id}")
                        logger.info(f"  - company_email: {company_email if company_email else None}")
                        logger.info(f"  - role: Employee")
                        logger.info(f"  - o_status: True")
                        
                        new_employee = User(
                            name=full_name,
                            company_employee_id=company_employee_id if company_employee_id else None,
                            designation=title if title else None,
                            location_id=location_id,
                            company_email=company_email if company_email else None,
                            role="Employee",  # Default role
                            o_status=True,  # Active by default
                            created_at=datetime.now()
                        )
                        logger.info(f"User object created: {new_employee}")
                        
                        session.add(new_employee)
                        logger.info("User added to session")
                        
                        session.flush()
                        logger.info("Session flushed successfully")
                        
                        imported_count += 1
                        logger.info(f"✓ Created new employee: {full_name}")
                    
                    logger.info(f"✓ ROW {index + 1} COMPLETED SUCCESSFULLY")
                    
                except Exception as e:
                    logger.error(f"\n{'!'*60}")
                    logger.error(f"✗ ERROR PROCESSING ROW {index + 1}")
                    logger.error(f"{'!'*60}")
                    logger.error(f"Error type: {type(e).__name__}")
                    logger.error(f"Error message: {str(e)}")
                    logger.error(f"Full traceback:\n{traceback.format_exc()}")
                    logger.error(f"{'!'*60}\n")
                    
                    error_count += 1
                    errors.append(f"Row {index + 1}: {str(e)}")
                    
                    # Rollback this row's changes
                    session.rollback()
            
            # Commit all changes
            logger.info(f"\n{'='*60}")
            logger.info(f"COMMITTING ALL CHANGES")
            logger.info(f"{'='*60}")
            session.commit()
            logger.info(f"✓ Commit successful")
            
            result = {
                "success": True,
                "message": f"Import completed. {imported_count} new employees, {updated_count} updated, {error_count} errors",
                "imported": imported_count,
                "updated": updated_count,
                "errors": error_count,
                "error_details": errors[:10]  # Limit error details to first 10
            }
            
            logger.info(f"\n{'='*60}")
            logger.info(f"IMPORT SUMMARY")
            logger.info(f"{'='*60}")
            logger.info(f"Success: {result['success']}")
            logger.info(f"Imported: {result['imported']}")
            logger.info(f"Updated: {result['updated']}")
            logger.info(f"Errors: {result['errors']}")
            logger.info(f"{'='*60}\n")
            
            return result
            
        except Exception as e:
            logger.error(f"\n{'!'*60}")
            logger.error(f"✗ FATAL ERROR IMPORTING EXCEL FILE")
            logger.error(f"{'!'*60}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error(f"Full traceback:\n{traceback.format_exc()}")
            logger.error(f"{'!'*60}\n")
            
            session.rollback()
            return {
                "success": False,
                "message": f"Error importing file: {str(e)}",
                "imported": 0,
                "errors": 1
            }