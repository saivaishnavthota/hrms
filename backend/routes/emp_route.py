from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models.emp_model import User
from schemas.emp_schema import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(employee: EmployeeCreate, session: Session = Depends(get_session)):
    if employee.email:
        existing_employee = session.exec(select(User).where(User.email == employee.email)).first()
        if existing_employee:
            raise HTTPException(status_code=400, detail="Email already exists")
    db_employee = User(**employee.dict())
    session.add(db_employee)
    session.commit()
    session.refresh(db_employee)
    return EmployeeResponse.from_orm(db_employee)

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    session: Session = Depends(get_session),
    name: Optional[str] = Query(None, description="Filter by employee name (partial match)"),
    role: Optional[str] = Query(None, description="Filter by role (partial match)")
):
    query = select(User)
    if name:
        query = query.where(User.name.ilike(f"%{name}%"))
    if role:
        query = query.where(User.role.ilike(f"%{role}%"))
    return [EmployeeResponse.from_orm(emp) for emp in session.exec(query).all()]

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, session: Session = Depends(get_session)):
    employee = session.get(User, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return EmployeeResponse.from_orm(employee)

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, employee: EmployeeUpdate, session: Session = Depends(get_session)):
    db_employee = session.get(User, employee_id)
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.email:
        existing_employee = session.exec(select(User).where(User.email == employee.email, User.id != employee_id)).first()
        if existing_employee:
            raise HTTPException(status_code=400, detail="Email already exists")
    for key, value in employee.dict(exclude_unset=True).items():
        setattr(db_employee, key, value)
    session.commit()
    session.refresh(db_employee)
    return EmployeeResponse.from_orm(db_employee)

@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, session: Session = Depends(get_session)):
    employee = session.get(User, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    session.delete(employee)
    session.commit()
    return None