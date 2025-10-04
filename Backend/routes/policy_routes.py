# routes/policy_routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from sqlmodel import Session, select
from models.policy_model import Policy, PolicySection
from database import engine

router = APIRouter(prefix="/policies", tags=["Policies"])

# Upload policy with location
@router.post("/upload")
async def upload_policy(file: UploadFile = File(...), location_id: int = Form(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File required")
    try:
        contents = await file.read()
        new_policy = Policy(
            file_name=file.filename,
            file_data=contents,
            file_type=file.content_type,
            location_id=location_id,
            sections_json=[],
        )
        with Session(engine) as session:
            session.add(new_policy)
            session.commit()
            session.refresh(new_policy)
        return {"message": "Policy uploaded", "policy_id": new_policy.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# List policies for a location
@router.get("/list")
def list_policies(location_id: int):
    with Session(engine) as session:
        policies = session.exec(select(Policy).where(Policy.location_id == location_id)).all()
        return [
            {
                "id": p.id,
                "file_name": p.file_name,
                "sections_json": p.sections_json,
                "location_id": p.location_id,
            }
            for p in policies
        ]


# Delete a policy
@router.delete("/delete/{policy_id}")
def delete_policy(policy_id: int):
    with Session(engine) as session:
        policy = session.get(Policy, policy_id)
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        session.delete(policy)
        session.commit()
        return {"message": "Policy deleted"}


# Update sections of a policy
@router.put("/update_sections/{policy_id}")
def update_sections(policy_id: int, sections: List[PolicySection]):
    with Session(engine) as session:
        policy = session.get(Policy, policy_id)
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        # Convert Pydantic list to dict
        policy.sections_json = [s.dict() for s in sections]
        session.add(policy)
        session.commit()
        session.refresh(policy)
        return {"message": "Sections updated", "sections_json": policy.sections_json}
