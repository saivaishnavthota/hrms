from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Request
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import traceback
import asyncio
import os
import re
from dotenv import load_dotenv

from azure.storage.blob import BlobServiceClient, ContentSettings, generate_blob_sas, BlobSasPermissions

# --- Local imports ---
from database import get_session
from auth import get_current_user
from models.document_model import Document
from models.user_model import User
from models.request_log_model import RequestLog
from schemas.document_schema import DraftResponse, DocumentStatus, EmployeeDocuments
from schemas.request_log_schema import RequestLogResponse
from utils.email import send_document_request_email

# --- Router setup ---
router = APIRouter(prefix="/documents", tags=["Documents"])

# --- Logging setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Azure setup ---
load_dotenv()
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "con-hrms")
ACCOUNT_NAME = "hrmsnxzen"
ACCOUNT_KEY = "Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w=="

blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

# ---------------------------------------------------------------------------
# 🔐 SAS Token Generator
# ---------------------------------------------------------------------------
def generate_sas_url(employee_id: int, file_name: str, expiry_years: int = 2):
    """Generate a SAS URL for a blob with read permissions"""
    blob_name = f"{employee_id}/{file_name}"
    sas_token = generate_blob_sas(
        account_name=ACCOUNT_NAME,
        container_name=AZURE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(days=365 * expiry_years)
    )
    return f"https://{ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_name}?{sas_token}"

# ---------------------------------------------------------------------------
# 📤 Upload Documents Route
# ---------------------------------------------------------------------------
@router.post("/upload")
async def upload_documents(request: Request, session: Session = Depends(get_session)):
    """Upload employee documents to Azure Blob Storage and store metadata with SAS URLs in database"""
    try:
        form_data = await request.form()
        logger.info(f"Received form data keys: {list(form_data.keys())}")

        # Validate employee_id
        employee_id = form_data.get("employeeId")
        if not employee_id:
            raise HTTPException(status_code=400, detail="employeeId is required")

        try:
            employee_id = int(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="employeeId must be a valid integer")

        uploaded_files = []

        # Process each file in the form data
        for field_name, field_value in form_data.items():
            logger.info(f"Processing field: {field_name}")
            if field_name == "employeeId":
                continue

            # Check if it's a file upload
            if hasattr(field_value, "read") and hasattr(field_value, "filename"):
                logger.info(f"Field {field_name} is a file with filename: {field_value.filename}")
                # Read file data
                file_data = await field_value.read()
                logger.info(f"Read {len(file_data)} bytes for {field_name}")
                if not file_data:
                    logger.warning(f"File {field_name} is empty - skipping")
                    continue

                # Define blob path
                blob_name = f"{employee_id}/{field_value.filename}"
                blob_client = container_client.get_blob_client(blob_name)
                content_settings = ContentSettings(content_type=field_value.content_type or "application/octet-stream")

                # Upload to Azure Blob Storage
                logger.info(f"Uploading {field_value.filename} to blob path: {blob_name}")
                try:
                    blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)
                    logger.info(f"Successfully uploaded {field_value.filename} to Azure")
                except Exception as blob_error:
                    logger.error(f"Blob upload failed for {field_value.filename}: {str(blob_error)}")
                    raise HTTPException(status_code=500, detail=f"Blob upload failed: {str(blob_error)}")

                # Generate SAS token and URL
                logger.info(f"About to generate SAS token for {blob_name}")
                try:
                    print("abcdefghijklmnop")
                    sas_token = generate_blob_sas(
                        account_name=ACCOUNT_NAME,
                        container_name=AZURE_CONTAINER_NAME,
                        blob_name=blob_name,
                        account_key=ACCOUNT_KEY,
                        permission=BlobSasPermissions(read=True),
                        expiry=datetime.utcnow() + timedelta(days=365 * 2)
                    )
                    file_url = f"https://{ACCOUNT_NAME}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{blob_name}?{sas_token}"
                    logger.info(f"Generated SAS URL: {file_url[:100]}...")  # Log first 100 chars
                except Exception as e:
                    logger.error(f"Failed to generate SAS URL for {blob_name}: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Failed to generate SAS URL: {str(e)}")

                # Delete existing document record to prevent duplication
                try:
                    existing_doc = session.exec(
                        select(Document).where(
                            Document.employee_id == employee_id,
                            Document.doc_type == field_name
                        )
                    ).first()
                    
                    if existing_doc:
                        logger.info(f"Deleting existing document record for {field_name}")
                        session.delete(existing_doc)
                        session.flush()  # Flush to apply delete before insert
                except Exception as e:
                    logger.warning(f"Error checking/deleting existing document: {str(e)}")

                # Insert metadata into database
                try:
                    insert_query = text("""
                        INSERT INTO employee_documents 
                        (employee_id, doc_type, file_id, file_name, file_url, uploaded_at)
                        VALUES (:employee_id, :doc_type, gen_random_uuid(), :file_name, :file_url, :uploaded_at)
                    """)
                    session.execute(
                        insert_query,
                        {
                            "employee_id": employee_id,
                            "doc_type": field_name,
                            "file_name": field_value.filename,
                            "file_url": file_url,
                            "uploaded_at": datetime.utcnow()
                        }
                    )
                    logger.info(f"Inserted metadata into DB for {field_value.filename} with URL: {file_url[:80]}")
                except Exception as e:
                    logger.error(f"DB insert failed for {field_value.filename}: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

                uploaded_files.append({
                    "doc_type": field_name,
                    "file_name": field_value.filename,
                    "file_url": file_url
                })

        # Commit all changes
        if uploaded_files:
            session.commit()
            logger.info(f"Successfully committed {len(uploaded_files)} documents for employee {employee_id}")
            return {
                "status": "success",
                "message": f"Successfully uploaded {len(uploaded_files)} documents",
                "uploaded_files": uploaded_files,
                "employeeId": employee_id,
            }

        logger.warning(f"No files were uploaded for employee {employee_id}")
        return {
            "status": "warning",
            "message": "No files were uploaded",
            "employeeId": employee_id
        }

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error uploading documents: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    

# ---------------------------------------------------------------------------
# 📑 Get Documents for a Specific Employee
# ---------------------------------------------------------------------------
@router.get("/emp/{employee_id}", response_model=List[DocumentStatus])
def list_documents(
    employee_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    documents = session.exec(select(Document).where(Document.employee_id == employee_id)).all()
    
    # Return empty array instead of 404 to allow frontend to display empty cards
    if not documents:
        return []

    doc_list = []
    for doc in documents:
        file_url = None
        if current_user.role == "HR":
            file_url = doc.file_url  # Use stored URL from database

        doc_list.append(
            DocumentStatus(
                doc_type=doc.doc_type,
                file_url=file_url,
                uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None
            )
        )

    return doc_list


# ---------------------------------------------------------------------------
# 👁 Preview Specific Document (HR Only)
# ---------------------------------------------------------------------------
@router.get("/{employee_id}/{doc_type}", response_model=DocumentStatus)
def preview_document(
    employee_id: int,
    doc_type: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    document = session.exec(
        select(Document).where(Document.employee_id == employee_id, Document.doc_type == doc_type)
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"No {doc_type} found for this employee")

    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Access denied: HR only")

    file_url = document.file_url  # Use stored URL from database

    return DocumentStatus(
        doc_type=document.doc_type,
        file_url=file_url,
        uploaded_at=document.uploaded_at.strftime("%d-%m-%Y") if document.uploaded_at else None
    )


# ---------------------------------------------------------------------------
# 📝 Save Draft Document Flags
# ---------------------------------------------------------------------------
@router.post("/save-draft", response_model=DraftResponse)
async def save_draft(
    employee_id: int = Form(...),
    updated_resume: Optional[bool] = Form(False),
    offer_letter: Optional[bool] = Form(False),
    latest_compensation_letter: Optional[bool] = Form(False),
    experience_relieving_letter: Optional[bool] = Form(False),
    latest_3_months_payslips: Optional[bool] = Form(False),
    form16_or_12b_or_taxable_income: Optional[bool] = Form(False),
    ssc_certificate: Optional[bool] = Form(False),
    hsc_certificate: Optional[bool] = Form(False),
    hsc_marksheet: Optional[bool] = Form(False),
    graduation_marksheet: Optional[bool] = Form(False),
    latest_graduation_certificate: Optional[bool] = Form(False),
    postgraduation_marksheet: Optional[bool] = Form(False),
    postgraduation_certificate: Optional[bool] = Form(False),
    aadhar: Optional[bool] = Form(False),
    pan: Optional[bool] = Form(False),
    passport: Optional[bool] = Form(False),
    session: Session = Depends(get_session)
):
    uploaded_at = datetime.utcnow().strftime("%d-%m-%Y")

    draft_flags = {
        "updated_resume": updated_resume,
        "offer_letter": offer_letter,
        "latest_compensation_letter": latest_compensation_letter,
        "experience_relieving_letter": experience_relieving_letter,
        "latest_3_months_payslips": latest_3_months_payslips,
        "form16_or_12b_or_taxable_income": form16_or_12b_or_taxable_income,
        "ssc_certificate": ssc_certificate,
        "hsc_certificate": hsc_certificate,
        "hsc_marksheet": hsc_marksheet,
        "graduation_marksheet": graduation_marksheet,
        "latest_graduation_certificate": latest_graduation_certificate,
        "postgraduation_marksheet": postgraduation_marksheet,
        "postgraduation_certificate": postgraduation_certificate,
        "aadhar": aadhar,
        "pan": pan,
        "passport": passport,
    }

    # TODO: Save flags in DB if a DocumentDraft table exists
    return DraftResponse(message="Draft saved successfully!", saved_at=uploaded_at)


# ---------------------------------------------------------------------------
# 📧 Request Document from Employee (HR Only)
# ---------------------------------------------------------------------------
@router.post("/request-doc", response_model=RequestLogResponse)
async def request_document(
    request: Request,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Access denied: HR only")

    body = await request.json()
    employee_id = body.get("employee_id")
    document_type = body.get("document_type", "General Document")

    if not employee_id:
        raise HTTPException(status_code=400, detail="employee_id is required")

    employee = session.get(User, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_log = RequestLog(
        employee_id=employee_id,
        requested_by=current_user.id,
        document_type=document_type,
        status="pending",
        requested_at=datetime.utcnow(),
    )

    session.add(new_log)
    session.commit()
    session.refresh(new_log)

    employee_email = employee.company_email or employee.email
    if employee_email:
        asyncio.create_task(
            send_document_request_email(employee_email, employee.name, document_type)
        )

    return RequestLogResponse(
        id=new_log.id,
        employee_id=new_log.employee_id,
        document_type=new_log.document_type,
        status=new_log.status,
        requested_at=new_log.requested_at,
    )


# ---------------------------------------------------------------------------
# 📊 Get All Employees with Documents (HR Only)
# ---------------------------------------------------------------------------
@router.get("/all-documents", response_model=List[EmployeeDocuments])
def get_all_documents(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all employees with their uploaded documents"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Access denied: HR only")

    try:
        # Get all employees
        employees = session.exec(select(User)).all()
        
        result = []
        for employee in employees:
            # Get documents for this employee
            documents = session.exec(
                select(Document).where(Document.employee_id == employee.id)
            ).all()
            
            # Transform documents
            doc_list = []
            for doc in documents:
                doc_list.append(
                    DocumentStatus(
                        doc_type=doc.doc_type,
                        file_url=doc.file_url,
                        uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None
                    )
                )
            
            result.append(
                EmployeeDocuments(
                    id=employee.id,
                    name=employee.name,
                    email=employee.company_email or employee.email or "",
                    role=employee.role,
                    documents=doc_list
                )
            )
        
        return result
    except Exception as e:
        logger.error(f"Error fetching all documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ---------------------------------------------------------------------------
# 📋 Get Request Logs (HR Only)
# ---------------------------------------------------------------------------
@router.get("/request-logs", response_model=List[RequestLogResponse])
def get_request_logs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all document request logs"""
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Access denied: HR only")

    try:
        from sqlalchemy import desc
        logs = session.exec(
            select(RequestLog).order_by(desc(RequestLog.requested_at))
        ).all()
        return [
            RequestLogResponse(
                id=log.id,
                employee_id=log.employee_id,
                document_type=log.document_type,
                status=log.status,
                requested_at=log.requested_at
            )
            for log in logs
        ]
    except Exception as e:
        logger.error(f"Error fetching request logs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ---------------------------------------------------------------------------
# 🗑 Delete Candidate (HR Only)
# ---------------------------------------------------------------------------
@router.delete("/delete/{employee_id}")
def delete_candidate(
    employee_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "HR":
        raise HTTPException(status_code=403, detail="Access denied: HR only")

    # Delete all blobs for employee
    blobs = container_client.list_blobs(name_starts_with=f"{employee_id}/")
    for blob in blobs:
        container_client.delete_blob(blob.name)

    # Delete documents
    docs = session.exec(select(Document).where(Document.employee_id == employee_id)).all()
    for d in docs:
        session.delete(d)

    # Delete user
    emp = session.exec(select(User).where(User.id == employee_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    session.delete(emp)

    session.commit()
    return {"message": f"Employee {employee_id} and documents deleted successfully"}

