from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class PolicyCategory(SQLModel, table=True):
    __tablename__ = "policy_categories"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_by: int = Field(foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class Policy(SQLModel, table=True):
    __tablename__ = "policies"
    id: Optional[int] = Field(default=None, primary_key=True)
    location_id: int = Field(foreign_key="locations.id")
    category_id: int = Field(foreign_key="policy_categories.id")
    title: str
    description: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None
    uploader_id: Optional[int] = Field(default=None, foreign_key="employees.id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
