from sqlmodel import SQLModel, Field
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "employees"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, nullable=False)
    role: Optional[str] = Field(max_length=100, default=None)
    email: Optional[str] = Field(max_length=255, default=None, unique=True)