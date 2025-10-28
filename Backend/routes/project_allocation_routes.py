from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlmodel import select
from typing import Dict, List, Optional
from database import get_session
from auth import get_current_user
from models.user_model import User
from models.project_allocation_model import ProjectAllocation
from models.projects_model import Project
from services.project_allocation_service import ProjectAllocationService
from datetime import datetime
import tempfile
import os

router = APIRouter(prefix="/allocations", tags=["Project Allocations"])

@router.post("/import")
async def import_allocations(
    project_id: int = Form(0),  # Default to 0 to extract from Excel
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload Excel file for bulk import of project allocations
    """
    # Check if user has permission (Admin, HR, or Account Manager)
    if current_user.role not in ["Admin", "HR", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin, HR, or Account Manager only")
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Import allocations
        result = ProjectAllocationService.import_from_excel(tmp_file_path, project_id, session)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "imported_count": result["imported"],
            "error_count": result["errors"],
            "error_details": result.get("error_details", [])
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@router.get("/summary/{employee_id}/{month}")
def get_allocation_summary(
    employee_id: int,
    month: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get allocation summary for an employee in a specific month
    Month format: YYYY-MM
    """
    # Check if user has permission (Admin, HR, Account Manager, Manager, or the employee themselves)
    if current_user.role not in ["Admin", "HR", "Account Manager", "Manager"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate month format
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    summary = ProjectAllocationService.get_allocation_summary(employee_id, month, session)
    
    return {
        "employee_id": employee_id,
        "month": month,
        "allocations": summary
    }

@router.get("/employee/{employee_id}")
def get_employee_allocations(
    employee_id: int,
    start_month: Optional[str] = None,
    end_month: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all allocations for an employee
    Optional query params: start_month, end_month (format: YYYY-MM)
    """
    # Check if user has permission (Admin, HR, Account Manager, Manager, or the employee themselves)
    if current_user.role not in ["Admin", "HR", "Account Manager", "Manager"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate month formats if provided
    if start_month:
        try:
            datetime.strptime(start_month, "%Y-%m")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_month format. Use YYYY-MM")
    
    if end_month:
        try:
            datetime.strptime(end_month, "%Y-%m")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_month format. Use YYYY-MM")
    
    # Build query with project name join
    query = select(ProjectAllocation, Project.project_name).join(
        Project, ProjectAllocation.project_id == Project.project_id
    ).where(ProjectAllocation.employee_id == employee_id)
    
    if start_month:
        query = query.where(ProjectAllocation.month >= start_month)
    
    if end_month:
        query = query.where(ProjectAllocation.month <= end_month)
    
    query = query.order_by(ProjectAllocation.month, ProjectAllocation.project_id)
    
    results = session.exec(query).all()
    
    # Group by month
    result = {}
    for allocation, project_name in results:
        month = allocation.month
        if month not in result:
            result[month] = []
        
        remaining_days = allocation.allocated_days - allocation.consumed_days
        result[month].append({
            "id": allocation.id,
            "employee_id": allocation.employee_id,
            "project_id": allocation.project_id,
            "project_name": project_name,
            "allocated_days": allocation.allocated_days,
            "consumed_days": allocation.consumed_days,
            "remaining_days": max(0, remaining_days),
            "employee_name": allocation.employee_name,
            "employee_email": getattr(allocation, 'employee_email', None),
            "company": allocation.company,
            "client": allocation.client,
            "month": allocation.month,
            "allocation_percentage": (allocation.consumed_days / allocation.allocated_days * 100) if allocation.allocated_days > 0 else 0
        })
    
    return {
        "employee_id": employee_id,
        "allocations_by_month": result
    }

@router.get("/project/{project_id}/{month}")
def get_project_allocations(
    project_id: int,
    month: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all employee allocations for a project in a month
    """
    # Check if user has permission (Admin, HR, or Account Manager)
    if current_user.role not in ["Admin", "HR", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin, HR, or Account Manager only")
    
    # Validate month format
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    # Verify project exists
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    allocations = session.exec(
        select(ProjectAllocation).where(
            ProjectAllocation.project_id == project_id,
            ProjectAllocation.month == month
        ).order_by(ProjectAllocation.employee_name)
    ).all()
    
    result = []
    for allocation in allocations:
        remaining_days = allocation.allocated_days - allocation.consumed_days
        result.append({
            "employee_id": allocation.employee_id,
            "employee_name": allocation.employee_name,
            "allocated_days": allocation.allocated_days,
            "consumed_days": allocation.consumed_days,
            "remaining_days": max(0, remaining_days),
            "company": allocation.company,
            "level": allocation.level,
            "client": allocation.client,
            "service_line": allocation.service_line
        })
    
    return {
        "project_id": project_id,
        "project_name": project.project_name,
        "month": month,
        "allocations": result
    }

@router.post("/save")
async def save_allocations(
    request: dict,  # {"employee_id": 71, "month": "2025-11", "allocations": [...]}
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Save project allocations for an employee for a specific month
    """
    # Extract values from request
    employee_id = request.get("employee_id")
    month = request.get("month")
    allocations = request.get("allocations", [])
    
    # Validate required fields
    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id is required")
    if not month:
        raise HTTPException(status_code=400, detail="month is required")
    if not isinstance(allocations, list):
        raise HTTPException(status_code=400, detail="allocations must be a list")
    
    # Check if user has permission (Admin, HR, Manager, or Account Manager)
    if current_user.role not in ["Admin", "HR", "Manager", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin, HR, Manager, or Account Manager only")
    
    # Validate month format
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    # Validate total allocation doesn't exceed 20 days
    total_allocation = sum(alloc.get("allocated_days", 0) for alloc in allocations)
    if total_allocation > 20:
        raise HTTPException(status_code=400, detail=f"Total allocation ({total_allocation} days) exceeds maximum capacity of 20 days")
    
    try:
        # Get employee info
        from models.user_model import User
        employee = session.get(User, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Clear existing allocations for this employee and month
        existing_allocations = session.exec(
            select(ProjectAllocation).where(
                ProjectAllocation.employee_id == employee_id,
                ProjectAllocation.month == month
            )
        ).all()
        
        for existing in existing_allocations:
            session.delete(existing)
        
        # Create new allocations
        for alloc in allocations:
            project_id = alloc.get("project_id")
            allocated_days = alloc.get("allocated_days", 0)
            
            if project_id and allocated_days > 0:
                # Verify project exists
                project = session.get(Project, project_id)
                if not project:
                    continue  # Skip invalid projects
                
                new_allocation = ProjectAllocation(
                    employee_id=employee_id,
                    project_id=project_id,
                    employee_name=employee.name,
                    company=getattr(employee, 'company', None),
                    level=getattr(employee, 'band', None),
                    client=project.account,  # Map project account to client field
                    service_line=None,  # Can be filled from project if needed
                    month=month,
                    allocated_days=allocated_days,
                    consumed_days=0.0
                )
                session.add(new_allocation)
        
        session.commit()
        
        return {
            "success": True,
            "message": f"Allocations saved successfully for {employee.name} in {month}",
            "total_allocated": total_allocation,
            "allocations_count": len([a for a in allocations if a.get("allocated_days", 0) > 0])
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving allocations: {str(e)}")

@router.get("/validate/{employee_id}/{project_id}/{date}")
def validate_allocation(
    employee_id: int,
    project_id: int,
    date: str,
    days_to_consume: float = 1.0,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Validate if an employee can work on a project for a specific date
    """
    # Check if user has permission (Admin, HR, Account Manager, Manager, or the employee themselves)
    if current_user.role not in ["Admin", "HR", "Account Manager", "Manager"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Parse date
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Check allocation availability
    is_valid, message = ProjectAllocationService.check_allocation_available(
        employee_id, project_id, date_obj, days_to_consume, session
    )
    
    return {
        "valid": is_valid,
        "message": message,
        "employee_id": employee_id,
        "project_id": project_id,
        "date": date,
        "days_to_consume": days_to_consume
    }

@router.post("/create-default-allocations/{month}")
async def create_default_allocations(
    month: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create default 20-day in-house project allocations for all employees for a given month
    """
    # Check if user has permission (Admin, HR, Manager, or Account Manager)
    if current_user.role not in ["Admin", "HR", "Manager", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin, HR, Manager, or Account Manager only")
    
    # Validate month format
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    
    try:
        result = ProjectAllocationService.create_default_monthly_allocations(month, session)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating default allocations: {str(e)}")

@router.post("/create-default-allocations-for-existing")
async def create_default_allocations_for_existing(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create default 20-day in-house project allocations for all existing employees for current month
    """
    # Check if user has permission (Admin, HR, Manager, or Account Manager)
    if current_user.role not in ["Admin", "HR", "Manager", "Account Manager"]:
        raise HTTPException(status_code=403, detail="Access denied: Admin, HR, Manager, or Account Manager only")
    
    try:
        # Get current month
        from datetime import datetime
        current_month = datetime.now().strftime("%Y-%m")
        
        result = ProjectAllocationService.create_default_monthly_allocations(current_month, session)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating default allocations: {str(e)}")
