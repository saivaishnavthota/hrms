from sqlmodel import SQLModel, Field
from typing import Optional, List
from datetime import date, datetime

# AttendanceProject Schema r
class AttendanceProjectRead(SQLModel):
    attendance_project_id: int
    project_id: int
    sub_task: Optional[str]

# Attendance Schema r/w
class AttendanceBase(SQLModel):
    employee_id: int
    date: date
    day: Optional[str]
    action: Optional[str]
    status: Optional[str]
    hours: Optional[int]

# Attendance Create Schema 
class AttendanceCreate(SQLModel):
    date: date                 # string "YYYY-MM-DD"
    action: str                # e.g., "Present"
    hours: Optional[int]       # integer
    project_ids: Optional[List[int]] = []
    sub_tasks: Optional[List[str]] = []


# Attendance Read Schema
class AttendanceRead(AttendanceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    attendance_projects: Optional[List[AttendanceProjectRead]] = []

class AttendanceResponse(SQLModel):
    date: str
    action: str
    hours: int
    projects: List[str] = []
    subTasks: List[dict] = []

