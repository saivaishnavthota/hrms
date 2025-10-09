from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_session
from models.hr_config_model import LeaveCategory, Department
from models.user_model import User
from schemas.hr_config_schema import (
    LeaveCategoryCreate, LeaveCategoryUpdate, LeaveCategoryResponse,
    DepartmentCreate, DepartmentUpdate, DepartmentResponse
)
from datetime import datetime

router = APIRouter(prefix="/hr-config", tags=["HR Configuration"])

def check_hr(hr_id: int, db: Session) -> bool:
    """Check if the user is an HR"""
    if not hr_id:
        return False
    employee = db.query(User).filter(User.id == hr_id).first()
    if not employee:
        raise HTTPException(status_code=401, detail="User not found")
    return employee.role == "HR"

def check_super_hr(hr_id: int, db: Session) -> bool:
    """Check if the user is a Super HR"""
    if not hr_id:
        return False
    employee = db.query(User).filter(User.id == hr_id).first()
    if not employee:
        raise HTTPException(status_code=401, detail="User not found")
    return employee.role == "HR" and employee.super_hr == True

# ==================== LEAVE CATEGORIES ROUTES ====================

@router.get("/leave-categories", response_model=List[LeaveCategoryResponse])
def get_leave_categories(
    db: Session = Depends(get_session),
    hr_id: int = Query(None),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all leave categories"""
    query = db.query(LeaveCategory)
    
    if not include_inactive:
        query = query.filter(LeaveCategory.is_active == True)
    
    categories = query.order_by(LeaveCategory.name).all()
    return categories

@router.get("/leave-categories/{category_id}", response_model=LeaveCategoryResponse)
def get_leave_category(
    category_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(None),
    employee_id: int = Query(None),
    manager_id: int = Query(None)
):
    """Get a specific leave category by ID"""
    category = db.query(LeaveCategory).filter(LeaveCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Leave category not found")
    return category

@router.post("/leave-categories", response_model=LeaveCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_leave_category(
    category: LeaveCategoryCreate,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR creating the category")
):
    """Create a new leave category (Super HR only)"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    # Check if category with same name already exists
    existing = db.query(LeaveCategory).filter(LeaveCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Leave category with this name already exists")
    
    new_category = LeaveCategory(
        name=category.name,
        default_days=category.default_days,
        description=category.description,
        created_by=hr_id
    )
    
    try:
        db.add(new_category)
        db.commit()
        db.refresh(new_category)
        return new_category
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create leave category: {str(e)}")

@router.put("/leave-categories/{category_id}", response_model=LeaveCategoryResponse)
def update_leave_category(
    category_id: int,
    category_update: LeaveCategoryUpdate,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR updating the category")
):
    """Update a leave category (Super HR only)"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    category = db.query(LeaveCategory).filter(LeaveCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Leave category not found")
    
    # Check if updating name and if it conflicts with another category
    if category_update.name and category_update.name != category.name:
        existing = db.query(LeaveCategory).filter(
            LeaveCategory.name == category_update.name,
            LeaveCategory.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Leave category with this name already exists")
    
    # Update fields
    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    category.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(category)
        return category
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update leave category: {str(e)}")

@router.delete("/leave-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave_category(
    category_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR deleting the category")
):
    """Delete a leave category (Super HR only) - Soft delete by setting is_active to False"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    category = db.query(LeaveCategory).filter(LeaveCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Leave category not found")
    
    # Soft delete
    category.is_active = False
    category.updated_at = datetime.now()
    
    try:
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to delete leave category: {str(e)}")

# ==================== DEPARTMENTS ROUTES ====================

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(
    db: Session = Depends(get_session),
    hr_id: int = Query(None),
    employee_id: int = Query(None),
    manager_id: int = Query(None),
    include_inactive: bool = Query(False)
):
    """Get all departments"""
    query = db.query(Department)
    
    if not include_inactive:
        query = query.filter(Department.is_active == True)
    
    departments = query.order_by(Department.name).all()
    return departments

@router.get("/departments/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(None),
    employee_id: int = Query(None),
    manager_id: int = Query(None)
):
    """Get a specific department by ID"""
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR creating the department")
):
    """Create a new department (Super HR only)"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    # Check if department with same name already exists
    existing = db.query(Department).filter(Department.name == department.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    new_department = Department(
        name=department.name,
        description=department.description,
        created_by=hr_id
    )
    
    try:
        db.add(new_department)
        db.commit()
        db.refresh(new_department)
        return new_department
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create department: {str(e)}")

@router.put("/departments/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    department_update: DepartmentUpdate,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR updating the department")
):
    """Update a department (Super HR only)"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if updating name and if it conflicts with another department
    if department_update.name and department_update.name != department.name:
        existing = db.query(Department).filter(
            Department.name == department_update.name,
            Department.id != department_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    # Update fields
    update_data = department_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(department, key, value)
    
    department.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(department)
        return department
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update department: {str(e)}")

@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_session),
    hr_id: int = Query(..., description="ID of the HR deleting the department")
):
    """Delete a department (Super HR only) - Soft delete by setting is_active to False"""
    if not check_super_hr(hr_id, db):
        raise HTTPException(status_code=403, detail="Super HR access required")
    
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Soft delete
    department.is_active = False
    department.updated_at = datetime.now()
    
    try:
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to delete department: {str(e)}")

