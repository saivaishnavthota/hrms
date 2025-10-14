from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SoftwareRequestCreate(BaseModel):
    employee_id: int
    manager_id: Optional[int] = None
    it_admin_id: int
    software_name: str
    software_version: Optional[str] = None
    additional_info: Optional[str] = None

class SoftwareRequestUpdate(BaseModel):
    status: str
    comments: Optional[str] = None

class SoftwareRequestResponse(BaseModel):
    id: int
    employee_id: int
    manager_id: Optional[int]
    it_admin_id: int
    software_name: str
    software_version: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
    comments: Optional[str]
    additional_info: Optional[str]
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    it_admin_name: Optional[str] = None
    it_admin_email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str