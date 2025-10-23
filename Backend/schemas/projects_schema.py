from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import date, datetime

# EmployeeProjectAssignment Schema
class EmployeeProjectAssignmentBase(SQLModel):
    employee_id: int
    assigned_by: Optional[int]

class EmployeeProjectAssignmentCreate(EmployeeProjectAssignmentBase):
    pass  # project_id will be provided at project level

class EmployeeProjectAssignmentRead(EmployeeProjectAssignmentBase):
    assignment_id: int
    assigned_at: datetime
    name: Optional[str]
    email: Optional[str]
    role: Optional[str]

# ProjectStatusLog Schema
class ProjectStatusLogBase(SQLModel):
    updated_by: Optional[int]
    new_status: Optional[str]

class ProjectStatusLogCreate(ProjectStatusLogBase):
    pass  # project_id will be provided at project level

class ProjectStatusLogRead(ProjectStatusLogBase):
    log_id: int
    updated_at: datetime

# Project Schema
class ProjectBase(SQLModel):
    project_name: str  # Project Name (Revenue) - Required
    project_name_commercial: Optional[str] = None  # Project Name (Commercial) - Optional
    account: Optional[str] = None  # Account - Optional
    project_objective: Optional[str] = None
    client_requirements: Optional[str] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    skills_required: Optional[str] = None
    status: Optional[str] = "Active"

# Project Create Schema – allows nested assignments and logs
class ProjectCreate(ProjectBase):
    assignments: Optional[List[EmployeeProjectAssignmentCreate]] = []
    status_logs: Optional[List[ProjectStatusLogCreate]] = []

# Project Read Schema – includes nested assignments and logs
class ProjectRead(ProjectBase):
    project_id: int
    created_at: datetime
    assignments: Optional[List[EmployeeProjectAssignmentRead]] = []
    status_logs: Optional[List[ProjectStatusLogRead]] = []
