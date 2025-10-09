from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Leave Category Schemas
class LeaveCategoryCreate(BaseModel):
    name: str
    default_days: int
    description: Optional[str] = None

class LeaveCategoryUpdate(BaseModel):
    name: Optional[str] = None
    default_days: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class LeaveCategoryResponse(BaseModel):
    id: int
    name: str
    default_days: int
    description: Optional[str]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

