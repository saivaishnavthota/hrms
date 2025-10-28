import pandas as pd
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from fuzzywuzzy import fuzz
from models.project_allocation_model import ProjectAllocation
from models.user_model import User
from models.projects_model import Project, EmployeeProjectAssignment
import logging

logger = logging.getLogger(__name__)

class ProjectAllocationService:
    
    @staticmethod
    def parse_month_header(header) -> Optional[str]:
        """
        Parse month header like 'Nov-25' to '2025-11' or datetime objects
        Returns None if not a valid month header
        """
        if not header:
            return None
        
        # Handle datetime objects directly
        if isinstance(header, datetime):
            result = header.strftime("%Y-%m")
            logger.info(f"Parsed datetime header: '{header}' -> '{result}'")
            return result
            
        # Clean the header string
        header_str = str(header).strip()
        logger.info(f"Parsing header: '{header_str}'")
        
        # Try multiple patterns
        patterns = [
            r'^([A-Za-z]{3})-(\d{2})$',  # Nov-25, Dec-25
            r'^([A-Za-z]{3})-(\d{4})$',  # Nov-2025, Dec-2025
            r'^([A-Za-z]+)-(\d{2})$',    # November-25, December-25
            r'^([A-Za-z]+)-(\d{4})$',    # November-2025, December-2025
        ]
        
        for pattern in patterns:
            match = re.match(pattern, header_str)
            if match:
                try:
                    month_part, year_part = match.groups()
                    logger.info(f"Matched pattern {pattern}: month='{month_part}', year='{year_part}'")
                    
                    # Try different date formats
                    date_formats = [
                        f"{month_part}-{year_part}",  # Nov-25, Nov-2025
                        f"{month_part} {year_part}",  # Nov 25, Nov 2025
                    ]
                    
                    for date_format in date_formats:
                        try:
                            # Try %b-%y format first (Nov-25)
                            if len(year_part) == 2:
                                dt = datetime.strptime(date_format, "%b-%y")
                            else:
                                dt = datetime.strptime(date_format, "%b-%Y")
                            
                            result = dt.strftime("%Y-%m")
                            logger.info(f"Parsed result: '{result}'")
                            return result
                        except:
                            continue
                            
                except Exception as e:
                    logger.info(f"Error parsing '{header_str}' with pattern {pattern}: {str(e)}")
                    continue
        
        logger.info(f"No valid pattern found for: '{header_str}'")
        return None

    @staticmethod
    def find_employee_by_name(name: str, session: Session) -> Optional[User]:
        """
        Try to find employee by name with multiple strategies:
        1. Exact match (case-insensitive)
        2. Fuzzy match (using fuzzywuzzy)
        3. Partial match (if name contains employee's name)
        """
        if not name or not name.strip():
            return None
            
        name = name.strip()
        
        # Strategy 1: Exact match (case-insensitive)
        # Use .scalars() to get User objects instead of Row objects
        statement = select(User).where(func.lower(User.name) == name.lower())
        result = session.exec(statement).scalars().first()  # Added .scalars()
        if result:
            logger.info(f"Exact match found for '{name}': {result.name}")
            return result
        
        # Strategy 2: Fuzzy match
        all_employees = session.exec(select(User)).scalars().all()  # Added .scalars()
        best_match = None
        best_score = 0
        
        for employee in all_employees:
            if employee.name:
                # Try different name variations
                name_variations = [
                    name.lower(),
                    name.lower().replace(' ', ''),
                    name.lower().replace('-', ' '),
                    name.lower().replace('_', ' ')
                ]
                
                for variation in name_variations:
                    score = fuzz.ratio(variation, employee.name.lower())
                    if score > best_score and score >= 70:  # Lowered threshold to 70%
                        best_score = score
                        best_match = employee
                        break
        
        if best_match:
            logger.info(f"Fuzzy matched '{name}' to '{best_match.name}' (score: {best_score})")
            return best_match
        
        # Strategy 3: Partial match
        for employee in all_employees:
            if employee.name and (name.lower() in employee.name.lower() or employee.name.lower() in name.lower()):
                logger.info(f"Partial match found for '{name}': {employee.name}")
                return employee
        
        logger.warning(f"No match found for employee name: '{name}'")
        return None

    @staticmethod
    def find_employee_by_company_id(company_employee_id: str, session: Session) -> Optional[User]:
        """
        Find employee by company employee ID (YTPL Emp ID).
        This is the primary method for project allocation imports.
        """
        if not company_employee_id:
            logger.warning("Empty company employee ID provided")
            return None
            
        # Clean the company employee ID
        cleaned_id = str(company_employee_id).strip()
        
        # Remove .0 suffix if it's a numeric value with decimal
        if cleaned_id.endswith('.0'):
            cleaned_id = cleaned_id[:-2]
        
        # Handle cases where it might be a float representation
        if '.' in cleaned_id:
            cleaned_id = cleaned_id.split('.')[0]
        
        # Ensure it's exactly 6 characters - pad with zeros if shorter, truncate if longer
        if len(cleaned_id) < 6:
            cleaned_id = cleaned_id.zfill(6)  # Pad with leading zeros
        elif len(cleaned_id) > 6:
            cleaned_id = cleaned_id[:6]  # Truncate to 6 characters
            logger.warning(f"Employee ID truncated to 6 characters: {cleaned_id}")
        
        # Validate that it's numeric (6-digit number)
        if not cleaned_id.isdigit():
            logger.warning(f"Invalid employee ID (non-numeric): {cleaned_id}")
            return None
        
        logger.info(f"Looking up employee by company ID: '{cleaned_id}'")
        
        # Find employee by company employee ID
        statement = select(User).where(User.company_employee_id == cleaned_id)
        result = session.exec(statement).scalars().first()
        
        if result:
            logger.info(f"✓ Found employee by company ID '{cleaned_id}': {result.name} (ID: {result.company_employee_id})")
            return result
        else:
            logger.warning(f"✗ No employee found with company ID: '{cleaned_id}'")
            return None



    @staticmethod
    def create_or_get_inhouse_project(session: Session) -> Project:
        """
        Create or get the default 'In house project' for all employees
        """
        # Try to find existing in-house project
        existing_project = session.exec(
            select(Project).where(Project.project_name == "In house project")
        ).scalars().first()
        
        if existing_project:
            logger.info(f"Found existing in-house project: {existing_project.project_name}")
            return existing_project
        
        # Create new in-house project
        new_project = Project(
            project_name="In house project",
            project_name_commercial="In house project",
            account="Internal",
            project_objective="Default internal project for employee capacity management",
            status="Active"
        )
        session.add(new_project)
        session.flush()  # This should populate the project_id
        logger.info(f"Created new in-house project: {new_project.project_name} with ID: {new_project.project_id}")
        return new_project

    @staticmethod
    def create_or_get_project(project_name: str, account: str, session: Session) -> Project:
        """
        Create project if it doesn't exist, or return existing one
        """
        # First try to find by project name
        existing_project = session.exec(
            select(Project).where(Project.project_name == project_name)
        ).scalars().first()
        
        if existing_project:
            logger.info(f"Found existing project: {existing_project.project_name}")
            return existing_project
        
        # Create new project
        new_project = Project(
            project_name=project_name,
            account=account,
            status="Active"
        )
        session.add(new_project)
        session.flush()  # This should populate the project_id
        logger.info(f"Created new project: {new_project.project_name} with ID: {new_project.project_id}")
        return new_project

    @staticmethod
    def update_employee_info(employee: User, company_employee_id: str, designation: str, band: str, session: Session):
        """
        Update employee with company info if provided
        """
        try:
            # Get fresh employee object from database
            fresh_employee = session.query(User).filter(User.id == employee.id).first()
            if not fresh_employee:
                logger.error(f"Employee {employee.id} not found in database")
                return
            
            updated = False
            
            if company_employee_id:
                # Convert to string and strip safely
                company_employee_id_clean = str(company_employee_id).strip()
                if company_employee_id_clean:
                    # Check if this company_employee_id is already taken by another employee
                    existing_employee_with_id = session.query(User).filter(
                        and_(
                            User.company_employee_id == company_employee_id_clean,
                            User.id != employee.id  # Not the same employee
                        )
                    ).first()
                    
                    if existing_employee_with_id:
                        logger.warning(
                            f"⚠️  Company employee ID {company_employee_id_clean} already exists for "
                            f"'{existing_employee_with_id.name}' (ID: {existing_employee_with_id.id}). "
                            f"Cannot update '{fresh_employee.name}' (ID: {fresh_employee.id}). "
                            f"Skipping ID update."
                        )
                    elif fresh_employee.company_employee_id != company_employee_id_clean:
                        fresh_employee.company_employee_id = company_employee_id_clean
                        updated = True
                        logger.info(f"✓ Updated company_employee_id for {fresh_employee.name} to {company_employee_id_clean}")
            
            if designation:
                # Convert to string and strip safely
                designation_clean = str(designation).strip()
                if designation_clean:
                    try:
                        if hasattr(fresh_employee, 'designation') and fresh_employee.designation != designation_clean:
                            fresh_employee.designation = designation_clean
                            updated = True
                            logger.info(f"✓ Updated designation for {fresh_employee.name}")
                    except AttributeError:
                        logger.warning(f"⚠️  designation column not available for employee {fresh_employee.name}")
            
            if band:
                # Convert to string and strip safely
                band_clean = str(band).strip()
                if band_clean:
                    try:
                        if hasattr(fresh_employee, 'band') and fresh_employee.band != band_clean:
                            fresh_employee.band = band_clean
                            updated = True
                            logger.info(f"✓ Updated band for {fresh_employee.name}")
                    except AttributeError:
                        logger.warning(f"⚠️  band column not available for employee {fresh_employee.name}")

            if updated:
                session.add(fresh_employee)
                logger.info(f"✓ Saved employee info for {fresh_employee.name}")
                
        except Exception as e:
            logger.error(f"✗ Error updating employee info for {employee.name}: {str(e)}")
            # Don't raise or rollback here - let the caller handle it

    @staticmethod
    def create_project_assignment(employee_id: int, project_id: int, session: Session):
        """
        Create employee project assignment if it doesn't exist
        This ensures projects appear in attendance form
        """
        # Check if assignment already exists
        existing_assignment = session.exec(
            select(EmployeeProjectAssignment).where(
                and_(
                    EmployeeProjectAssignment.employee_id == employee_id,
                    EmployeeProjectAssignment.project_id == project_id
                )
            )
        ).first()
        
        if not existing_assignment:
            # Create new assignment
            assignment = EmployeeProjectAssignment(
                employee_id=employee_id,
                project_id=project_id,
                assigned_by=1  # Default to admin/system
            )
            session.add(assignment)
            logger.info(f"Created project assignment: Employee {employee_id} -> Project {project_id}")
        else:
            logger.info(f"Project assignment already exists: Employee {employee_id} -> Project {project_id}")

    @staticmethod
    def import_from_excel(file_path: str, project_id: int = 0, session: Session = None) -> Dict:
        """
        Import project allocations from Excel file.
        
        Excel format expected:
        - Column 0: No.
        - Column 1: Name (for reference only)
        - Column 2: Company Name
        - Column 3: Band
        - Column 4: Account
        - Column 5: Project Name(Revenue)
        - Column 6: Project Name (Commercial)
        - Column 7: India-Location
        - Column 8: Location
        - Columns 9-23: Month columns (Nov-25 to Jan-27)
        - Column 24: YTPL Emp ID (company employee ID - PRIMARY LOOKUP METHOD)
        - Column 25: Designation
        
        Args:
            file_path: Path to Excel file
            project_id: Project ID (0 = extract from Excel, >0 = use specific project)
            session: Database session
            
        Returns:
            Dict with import results
        """
        try:
            # Read Excel file
            df = pd.read_excel(file_path, header=0)
            logger.info(f"Read Excel file with {len(df)} rows and {len(df.columns)} columns")
            logger.info(f"Column names: {list(df.columns)}")
            
            # Find month columns
            month_columns = []
            for i, col in enumerate(df.columns):
                logger.info(f"Checking column {i}: '{col}' (type: {type(col)})")
                month_str = ProjectAllocationService.parse_month_header(col)
                if month_str:
                    month_columns.append((i, col, month_str))
                    logger.info(f"Found month column: '{col}' -> '{month_str}'")
            
            if not month_columns:
                # Try to find any columns that might be month-related
                potential_months = []
                for i, col in enumerate(df.columns):
                    col_str = str(col).strip()
                    # Check for various month patterns
                    if any(month in col_str.lower() for month in ['nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct']):
                        potential_months.append(f"Column {i}: '{col_str}'")
                
                error_msg = "No month columns found. Expected format: 'Nov-25', 'Dec-25', etc."
                if potential_months:
                    error_msg += f"\n\nFound potential month columns: {', '.join(potential_months[:5])}"
                all_columns = ', '.join([f"'{col}'" for col in df.columns])
                error_msg += f"\n\nAll columns found: {all_columns}"
                
                return {
                    "success": False,
                    "message": error_msg,
                    "imported": 0,
                    "errors": 0
                }
            
            logger.info(f"Found {len(month_columns)} month columns")
            
            imported_count = 0
            error_count = 0
            errors = []
            projects_created = 0
            
            # If project_id is 0, we'll extract project info from Excel
            use_excel_projects = (project_id == 0)
            
            # Process each row
            for index, row in df.iterrows():
                try:
                    # Extract company employee ID (YTPL Emp ID) - primary lookup method
                    # YTPL Emp ID is at column 24 (index 24) based on the logs
                    company_employee_id_raw = row.iloc[24] if len(row) > 24 and pd.notna(row.iloc[24]) else None  # YTPL Emp ID
                    
                    # Debug logging
                    logger.info(f"Row {index + 1}: Raw YTPL Emp ID = {company_employee_id_raw} (type: {type(company_employee_id_raw)})")
                    
                    # Convert to string and check if it's meaningful
                    if company_employee_id_raw is not None:
                        company_employee_id_str = str(company_employee_id_raw).strip()
                        logger.info(f"Row {index + 1}: Cleaned YTPL Emp ID = '{company_employee_id_str}'")
                        # Check for invalid values (0, 0.0, empty, nan, etc.)
                        if (not company_employee_id_str or 
                            company_employee_id_str.lower() in ['nan', 'none', ''] or
                            company_employee_id_str in ['0', '0.0']):
                            company_employee_id_raw = None
                            logger.info(f"Row {index + 1}: YTPL Emp ID is empty/invalid after cleaning")
                    
                    if not company_employee_id_raw:
                        error_count += 1
                        errors.append(f"Row {index + 1}: Empty or invalid YTPL Emp ID")
                        continue
                    
                    # Find employee by company ID
                    employee = ProjectAllocationService.find_employee_by_company_id(company_employee_id_raw, session)
                    if not employee:
                        error_count += 1
                        errors.append(f"Row {index + 1}: Employee with YTPL Emp ID '{company_employee_id_raw}' not found in database")
                        continue
                    
                    # Extract metadata with proper type handling
                    employee_name = str(row.iloc[1]).strip() if len(row) > 1 and pd.notna(row.iloc[1]) else ""  # Name (for reference)
                    company = str(row.iloc[2]).strip() if len(row) > 2 and pd.notna(row.iloc[2]) else None  # Company Name
                    band = str(row.iloc[3]).strip() if len(row) > 3 and pd.notna(row.iloc[3]) else None  # Band
                    account = str(row.iloc[4]).strip() if len(row) > 4 and pd.notna(row.iloc[4]) else None  # Account
                    project_name = str(row.iloc[5]).strip() if len(row) > 5 and pd.notna(row.iloc[5]) else None  # Account Name/Project Name (Commercial)
                    location = str(row.iloc[6]).strip() if len(row) > 6 and pd.notna(row.iloc[6]) else None  # Location
                    designation = str(row.iloc[25]).strip() if len(row) > 25 and pd.notna(row.iloc[25]) else None  # Designation
                    
                    # Update employee info with the cleaned company employee ID
                    ProjectAllocationService.update_employee_info(
                        employee, employee.company_employee_id, designation, band, session
                    )
                    
                    # Create or get project
                    if use_excel_projects:
                        # Extract project info from Excel
                        if project_name:
                            project = ProjectAllocationService.create_or_get_project(
                                project_name, account, session
                            )
                            actual_project_id = project.project_id
                        else:
                            error_count += 1
                            errors.append(f"Row {index + 1}: No project name found in Excel")
                            continue
                    else:
                        # Use provided project_id
                        if project_name:
                            # Still create/get project from Excel but use provided project_id as fallback
                            project = ProjectAllocationService.create_or_get_project(
                                project_name, account, session
                            )
                            actual_project_id = project.project_id
                        else:
                            # Use provided project_id if no project name in Excel
                            actual_project_id = project_id
                            project = session.get(Project, project_id)
                            if not project:
                                error_count += 1
                                errors.append(f"Row {index + 1}: Project with ID {project_id} not found")
                                continue
                    
                    # Process each month column
                    for col_index, col_name, month_str in month_columns:
                        try:
                            value = row.iloc[col_index]
                            
                            # Skip if value is "-", empty, or NaN
                            if pd.isna(value) or str(value).strip() in ["-", "", "nan"]:
                                continue
                            
                            # Convert to float
                            try:
                                allocated_days = float(value)
                            except (ValueError, TypeError):
                                logger.warning(f"Row {index + 1}, Column {col_name}: Invalid value '{value}'")
                                continue
                            
                            # Check for unrealistic values (>30 days)
                            if allocated_days > 30:
                                logger.warning(f"Row {index + 1}, Column {col_name}: Unrealistic value {allocated_days} days")
                            
                            # Create project assignment for attendance form
                            ProjectAllocationService.create_project_assignment(
                                employee.id, actual_project_id, session
                            )
                            
                            # Create or update ProjectAllocation
                            existing = session.exec(
                                select(ProjectAllocation).where(
                                    and_(
                                        ProjectAllocation.employee_id == employee.id,
                                        ProjectAllocation.project_id == actual_project_id,
                                        ProjectAllocation.month == month_str
                                    )
                                )
                            ).first()
                            
                            if existing:
                                existing.allocated_days = allocated_days
                                existing.employee_name = employee_name
                                existing.company = company
                                existing.level = band
                                existing.client = account
                                existing.service_line = location_type
                                existing.updated_at = datetime.now()
                            else:
                                allocation = ProjectAllocation(
                                    employee_id=employee.id,
                                    project_id=actual_project_id,
                                    employee_name=employee_name,
                                    company=company,
                                    level=band,
                                    client=account,
                                    service_line=location_type,
                                    month=month_str,
                                    allocated_days=allocated_days,
                                    consumed_days=0.0
                                )
                                session.add(allocation)
                            
                            imported_count += 1
                            
                        except Exception as e:
                            logger.error(f"Error processing row {index + 1}, column {col_name}: {str(e)}")
                            error_count += 1
                            errors.append(f"Row {index + 1}, Column {col_name}: {str(e)}")
                
                except Exception as e:
                    logger.error(f"Error processing row {index + 1}: {str(e)}")
                    error_count += 1
                    errors.append(f"Row {index + 1}: {str(e)}")
            
            # Commit all changes
            session.commit()
            
            return {
                "success": True,
                "message": f"Import completed. {imported_count} allocations imported, {error_count} errors",
                "imported": imported_count,
                "errors": error_count,
                "error_details": errors[:10]  # Limit error details to first 10
            }
            
        except Exception as e:
            logger.error(f"Error importing Excel file: {str(e)}")
            session.rollback()
            return {
                "success": False,
                "message": f"Error importing file: {str(e)}",
                "imported": 0,
                "errors": 1
            }

    @staticmethod
    def check_allocation_available(employee_id: int, project_id: int, date: datetime, days_to_consume: float, session: Session) -> Tuple[bool, str]:
        """
        Validate before marking attendance:
        - Check if total monthly days < 20
        - Check if project allocation available for that month
        """
        month_str = date.strftime("%Y-%m")
        
        # Check total monthly days across all projects
        result = session.exec(
            select(func.sum(ProjectAllocation.consumed_days)).where(
                and_(
                    ProjectAllocation.employee_id == employee_id,
                    ProjectAllocation.month == month_str
                )
            )
        ).scalars().first()
        total_consumed = float(result) if result is not None else 0.0
        
        if total_consumed + days_to_consume > 20:
            return False, f"Employee cannot work more than 20 days in {month_str}. Currently consumed: {total_consumed}, trying to add: {days_to_consume}"
        
        # Check project-specific allocation
        allocation = session.exec(
            select(ProjectAllocation).where(
                and_(
                    ProjectAllocation.employee_id == employee_id,
                    ProjectAllocation.project_id == project_id,
                    ProjectAllocation.month == month_str
                )
            )
        ).scalars().first()
        
        if not allocation:
            return False, f"No allocation found for employee {employee_id} on project {project_id} for {month_str}"
        
        # Ensure values are floats before comparison
        consumed_days = float(allocation.consumed_days) if allocation.consumed_days is not None else 0.0
        allocated_days = float(allocation.allocated_days) if allocation.allocated_days is not None else 0.0
        
        if consumed_days + days_to_consume > allocated_days:
            return False, f"Project allocation exceeded. Allocated: {allocated_days}, consumed: {consumed_days}, trying to add: {days_to_consume}"
        
        return True, "Allocation validation passed"

    @staticmethod
    def update_consumed_days(employee_id: int, project_id: int, date: datetime, days_consumed: float, session: Session):
        """
        Update after marking attendance:
        - Find ProjectAllocation for that employee/project/month
        - Increment consumed_days
        """
        month_str = date.strftime("%Y-%m")
        
        allocation = session.exec(
            select(ProjectAllocation).where(
                and_(
                    ProjectAllocation.employee_id == employee_id,
                    ProjectAllocation.project_id == project_id,
                    ProjectAllocation.month == month_str
                )
            )
        ).scalars().first()
        
        if allocation:
            # Ensure consumed_days is a float before adding
            current_consumed = float(allocation.consumed_days) if allocation.consumed_days is not None else 0.0
            allocation.consumed_days = current_consumed + days_consumed
            allocation.updated_at = datetime.now()
            session.add(allocation)
        else:
            logger.warning(f"No allocation found for employee {employee_id}, project {project_id}, month {month_str}")

    @staticmethod
    def get_allocation_summary(employee_id: int, month: str, session: Session) -> List[Dict]:
        """
        Get monthly summary:
        - Return all project allocations with allocated/consumed/remaining days
        """
        allocations = session.exec(
            select(ProjectAllocation).where(
                and_(
                    ProjectAllocation.employee_id == employee_id,
                    ProjectAllocation.month == month
                )
            )
        ).scalars().all()
        
        result = []
        for allocation in allocations:
            remaining_days = allocation.allocated_days - allocation.consumed_days
            result.append({
                "project_id": allocation.project_id,
                "project_name": allocation.project.project_name if allocation.project else "Unknown",
                "allocated_days": allocation.allocated_days,
                "consumed_days": allocation.consumed_days,
                "remaining_days": max(0, remaining_days),
                "employee_name": allocation.employee_name,
                "company": allocation.company,
                "client": allocation.client
            })
        
        return result

    @staticmethod
    def create_default_monthly_allocations(month: str, session: Session) -> Dict:
        """
        Create default 20-day in-house project allocations for all employees for a given month
        """
        try:
            # Get or create the in-house project
            inhouse_project = ProjectAllocationService.create_or_get_inhouse_project(session)
            
            # Get all active employees
            all_employees = session.exec(select(User)).scalars().all()
            
            created_count = 0
            updated_count = 0
            errors = []
            
            for employee in all_employees:
                try:
                    # Check if allocation already exists for this employee and month
                    existing_allocation = session.exec(
                        select(ProjectAllocation).where(
                            and_(
                                ProjectAllocation.employee_id == employee.id,
                                ProjectAllocation.project_id == inhouse_project.project_id,
                                ProjectAllocation.month == month
                            )
                        )
                    ).first()
                    
                    if existing_allocation:
                        # Update existing allocation to 20 days if it's different
                        if existing_allocation.allocated_days != 20.0:
                            existing_allocation.allocated_days = 20.0
                            existing_allocation.updated_at = datetime.now()
                            session.add(existing_allocation)
                            updated_count += 1
                            logger.info(f"Updated in-house allocation for {employee.name} in {month}")
                    else:
                        # Create new allocation
                        new_allocation = ProjectAllocation(
                            employee_id=employee.id,
                            project_id=inhouse_project.project_id,
                            employee_name=employee.name,
                            company=getattr(employee, 'company', None),
                            level=getattr(employee, 'band', None),
                            client=inhouse_project.account,
                            service_line="Internal",
                            month=month,
                            allocated_days=20.0,
                            consumed_days=0.0
                        )
                        session.add(new_allocation)
                        created_count += 1
                        logger.info(f"Created in-house allocation for {employee.name} in {month}")
                        
                        # Also create employee project assignment for attendance form
                        ProjectAllocationService.create_project_assignment(
                            employee.id, inhouse_project.project_id, session
                        )
                        
                except Exception as e:
                    error_msg = f"Error creating allocation for {employee.name}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            session.commit()
            
            return {
                "success": True,
                "message": f"Default allocations created/updated for {month}",
                "created": created_count,
                "updated": updated_count,
                "errors": len(errors),
                "error_details": errors[:10]  # Limit error details
            }
            
        except Exception as e:
            logger.error(f"Error creating default monthly allocations: {str(e)}")
            session.rollback()
            return {
                "success": False,
                "message": f"Error creating default allocations: {str(e)}",
                "created": 0,
                "updated": 0,
                "errors": 1
            }
