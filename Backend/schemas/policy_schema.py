from typing import List, Optional
from pydantic import BaseModel

class Section(BaseModel):
    heading: str
    content: str

class PolicyResponse(BaseModel):
    id: int
    file_name: str
    sections_json: Optional[List[Section]] = []
    location_id: int

    class Config:
        from_attributes = True

class PolicyEditRequest(BaseModel):
    sections_json: List[Section]
