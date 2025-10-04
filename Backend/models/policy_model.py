from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from pydantic import BaseModel

class Policy(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_name: str
    file_data: bytes
    file_type: str
    location_id: int
    sections_json: List[Dict] = Field(
        sa_column=Column(JSONB),  # <-- This makes it PostgreSQL JSONB
        default_factory=list
    )

class PolicySection(BaseModel):
    heading: str
    content: str