from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import date, datetime
 
class AttendanceProjectRead(SQLModel):
    attendance_project_id: int
    project_id: int
    sub_task: Optional[str]
    hours: Optional[float]  # Changed from int to float
 
class SubTask(SQLModel):
    project_id: int
    sub_task: str
    hours: float  # Changed from int to float
 
class AttendanceBase(SQLModel):
    employee_id: int
    date: date
    day: Optional[str]
    action: Optional[str]
    status: Optional[str]
    hours: Optional[float]  # Changed from int to float
 
class AttendanceCreate(SQLModel):
    date: date
    action: str
    hours: Optional[float]  # Changed from int to float
    project_ids: Optional[List[int]] = []
    sub_tasks: List[SubTask] = []
 
class AttendanceRead(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attendance_projects: Optional[List[AttendanceProjectRead]] = []
 
class AttendanceResponse(SQLModel):
    date: str
    action: str
    hours: float  # Changed from int to float
    projects: List[dict] = []
    subTasks: List[dict] = []