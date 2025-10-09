from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PolicyCategoryBase(BaseModel):
    name: str
    color: Optional[str] = '#3B82F6'
    icon: Optional[str] = '📄'

class PolicyCategoryCreate(PolicyCategoryBase):
    pass

class PolicyCategoryUpdate(PolicyCategoryBase):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class PolicyCategoryOut(PolicyCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicyCategoryWithCount(PolicyCategoryOut):
    policy_count: int

class PolicyBase(BaseModel):
    title: str
    description: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class PolicyCreate(PolicyBase):
    category_id: int

class PolicyUpdate(PolicyBase):
    category_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class PolicyOut(PolicyBase):
    id: int
    location_id: int
    category_id: int
    uploader_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    location_name: Optional[str] = None
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None
    uploader_name: Optional[str] = None

    class Config:
        from_attributes = True

class PoliciesByCategory(BaseModel):
    category_id: int
    category_name: str
    category_icon: str
    category_color: str
    count: int
    policies: List[PolicyOut]

class PoliciesByLocation(BaseModel):
    categories: List[PoliciesByCategory]