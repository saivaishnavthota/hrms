from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from database import get_session
from models.policy_model import CompanyPolicy
from auth import get_current_user
from models.user_model import User
from azure.storage.blob import BlobServiceClient, ContentSettings, generate_blob_sas, BlobSasPermissions
import os
from dotenv import load_dotenv

router = APIRouter(prefix="/policies", tags=["Policies"])

load_dotenv()
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING", "DefaultEndpointsProtocol=https;AccountName=hrmsnxzen;AccountKey=Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==;EndpointSuffix=core.windows.net")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "con-hrms")
ACCOUNT_NAME = os.getenv("ACCOUNT_NAME", "hrmsnxzen")
ACCOUNT_KEY = os.getenv("ACCOUNT_KEY", "Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==")

blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

def generate_blob_url_with_sas(location_id: int, file_name: str) -> str:
    """Generate Azure Blob URL with SAS token for policy document"""
    blob_name = f"policies/location_{location_id}/{file_name}"
    
    # Generate SAS token valid for 10 years (policies are long-term)
    sas_token = generate_blob_sas(
        account_name=ACCOUNT_NAME,
        container_name=AZURE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(days=3650)  # 10 years
    )
    
    return f"https://{ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_name}?{sas_token}"

@router.post("/upload")
async def upload_policy(
    file: UploadFile = File(...),
    location_id: int = Form(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Upload a new company policy document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Allowed file types
        allowed_extensions = ['.pdf', '.doc', '.docx', '.txt']
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Read file data
        file_data = await file.read()
        if not file_data:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Check file size (max 10MB)
        if len(file_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Upload to Azure Blob Storage
        blob_name = f"policies/location_{location_id}/{file.filename}"
        blob_client = container_client.get_blob_client(blob_name)
        content_settings = ContentSettings(content_type=file.content_type)
        blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)
        
        # Generate URL with SAS token
        file_url = generate_blob_url_with_sas(location_id, file.filename)
        
        # Create policy record
        policy = CompanyPolicy(
            location_id=location_id,
            file_name=file.filename,
            file_url=file_url,
            uploaded_by=current_user.id,
            sections_json=[]  # Empty initially, can be edited later
        )
        
        session.add(policy)
        session.commit()
        session.refresh(policy)
        
        return {
            "message": "Policy uploaded successfully",
            "policy_id": policy.id,
            "file_name": policy.file_name,
            "file_url": policy.file_url
        }
    
    except Exception as e:
        session.rollback()
        print(f"Error uploading policy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload policy: {str(e)}")

@router.get("/list")
def list_policies(
    location_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all policies, optionally filtered by location"""
    try:
        query = select(CompanyPolicy).where(CompanyPolicy.deleted_at.is_(None))
        
        if location_id:
            query = query.where(CompanyPolicy.location_id == location_id)
        
        policies = session.exec(query.order_by(CompanyPolicy.created_at.desc())).all()
        
        result = []
        for policy in policies:
            result.append({
                "id": policy.id,
                "location_id": policy.location_id,
                "file_name": policy.file_name,
                "file_url": policy.file_url,
                "sections_json": policy.sections_json or [],
                "uploaded_by": policy.uploaded_by,
                "created_at": policy.created_at,
                "updated_at": policy.updated_at
            })
        
        return result
    
    except Exception as e:
        print(f"Error listing policies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list policies: {str(e)}")

@router.put("/edit/{policy_id}")
async def edit_policy(
    policy_id: int,
    sections_json: str = Form(...),  # JSON string from frontend
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Edit policy sections"""
    try:
        import json
        
        policy = session.get(CompanyPolicy, policy_id)
        if not policy or policy.deleted_at:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Parse JSON string
        sections = json.loads(sections_json)
        
        # Update policy
        policy.sections_json = sections
        policy.updated_at = datetime.utcnow()
        
        session.add(policy)
        session.commit()
        session.refresh(policy)
        
        return {
            "message": "Policy updated successfully",
            "policy": {
                "id": policy.id,
                "file_name": policy.file_name,
                "sections_json": policy.sections_json
            }
        }
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        session.rollback()
        print(f"Error editing policy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to edit policy: {str(e)}")

@router.delete("/delete/{policy_id}")
def delete_policy(
    policy_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a policy"""
    try:
        policy = session.get(CompanyPolicy, policy_id)
        if not policy or policy.deleted_at:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Soft delete
        policy.deleted_at = datetime.utcnow()
        session.add(policy)
        session.commit()
        
        return {"message": "Policy deleted successfully"}
    
    except Exception as e:
        session.rollback()
        print(f"Error deleting policy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete policy: {str(e)}")

@router.get("/my-policies")
def get_my_policies(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get policies for the current user's location"""
    try:
        if not current_user.location_id:
            return []
        
        policies = session.exec(
            select(CompanyPolicy).where(
                CompanyPolicy.location_id == current_user.location_id,
                CompanyPolicy.deleted_at.is_(None)
            ).order_by(CompanyPolicy.created_at.desc())
        ).all()
        
        result = []
        for policy in policies:
            result.append({
                "id": policy.id,
                "file_name": policy.file_name,
                "file_url": policy.file_url,
                "sections_json": policy.sections_json or [],
                "created_at": policy.created_at
            })
        
        return result
    
    except Exception as e:
        print(f"Error fetching my policies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch policies: {str(e)}")
