from fastapi import APIRouter, UploadFile, File, HTTPException, Depends,Form,Request

from azure.storage.blob import BlobServiceClient, ContentSettings
from fastapi.responses import JSONResponse,StreamingResponse
from sqlmodel import Session, select
from typing import List
from models.document_model import Document
from dependencies import get_session
from auth import get_current_user  # your JWT dependency
import psycopg2
import traceback
import logging
from datetime import datetime
import io
from typing import Optional
from models.user_model import User
from schemas.document_schema import  DraftResponse,DocumentStatus,EmployeeDocuments

router = APIRouter(prefix="/documents", tags=["Documents"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AZURE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=hrmsnxzen;AccountKey=Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==;EndpointSuffix=core.windows.net"
AZURE_CONTAINER_NAME = "con-hrms"
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

def build_blob_url(employee_id: int, file_name: str):
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{employee_id}/{file_name}"


@router.post("/upload")
async def upload_documents(request: Request, session: Session = Depends(get_session)):
    try:
        form_data = await request.form()
        logger.info(f"Received form data keys: {list(form_data.keys())}")

        # Extract employeeId
        employee_id = form_data.get("employeeId")
        if not employee_id:
            raise HTTPException(status_code=400, detail="employeeId is required")
        try:
            employee_id = int(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="employeeId must be a valid integer")

        uploaded_files = []

        for field_name, field_value in form_data.items():
            if field_name == "employeeId":
                continue

            logger.info(f"Processing field: {field_name}, type: {type(field_value)}")

            if hasattr(field_value, 'read') and hasattr(field_value, 'filename'):
                file_data = await field_value.read()
                if not file_data:
                    logger.warning(f"File {field_name} is empty")
                    continue

                # Create unique blob name
                blob_name = f"{employee_id}/{field_value.filename}"

                # Upload to Azure Blob Storage
                blob_client = container_client.get_blob_client(blob_name)
                content_settings = ContentSettings(content_type=field_value.content_type)
                blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)

                file_url = blob_client.url  # The URL of the uploaded file in Azure

                # Store file metadata in database
                from sqlalchemy import text

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

                uploaded_files.append({"doc_type": field_name, "file_name": field_value.filename, "file_url": file_url})
                logger.info(f"Inserted metadata for {field_value.filename} into employee_documents")

        if uploaded_files:
            session.commit()
            return {
                "message": f"Successfully uploaded {len(uploaded_files)} documents",
                "uploaded_files": uploaded_files,
                "employeeId": employee_id
            }
        else:
            logger.warning("No files were uploaded")
            return {"message": "No files were uploaded", "employeeId": employee_id}

    except Exception as e:
        session.rollback()
        logger.error(f"Error uploading documents: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
@router.get("/all-documents", response_model=List[EmployeeDocuments])
def all_documents(session: Session = Depends(get_session)):
    employees = session.exec(select(User)).all()
    result = []

    for emp in employees:
        docs = session.exec(select(Document).where(Document.employee_id == emp.id)).all()
        doc_list = []
        for doc in docs:
            file_url = build_blob_url(emp.id, doc.file_name)
            doc_list.append(DocumentStatus(
                doc_type=doc.doc_type,
                file_url=file_url,
                uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None
            ))
        email = emp.company_email or emp.email or "no-email@company.com"
        result.append(EmployeeDocuments(
            id=emp.id,
            name=emp.name,
            email=email,
            role=emp.role,
            documents=doc_list
        ))
    return result

# Route: Get documents for a specific employee
@router.get("/emp/{employee_id}", response_model=List[DocumentStatus])
def list_documents(employee_id: int, session: Session = Depends(get_session)):
    documents = session.exec(select(Document).where(Document.employee_id == employee_id)).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this employee")

    return [
        DocumentStatus(
            doc_type=doc.doc_type,
            file_url=build_blob_url(employee_id, doc.file_name),
            uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None
        ) for doc in documents
    ]

# Route: Get a single document URL or preview link
@router.get("/{employee_id}/{doc_type}", response_model=DocumentStatus)
def preview_document(employee_id: int, doc_type: str, session: Session = Depends(get_session)):
    document = session.exec(
        select(Document).where(Document.employee_id == employee_id, Document.doc_type == doc_type)
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"No {doc_type} found for this employee")

    return DocumentStatus(
        doc_type=document.doc_type,
        file_url=build_blob_url(employee_id, document.file_name),
        uploaded_at=document.uploaded_at.strftime("%d-%m-%Y") if document.uploaded_at else None
    )

# Route: Save draft flags for documents
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
    # Update or insert draft flags in the database
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

    # Here you would update the draft in your DB; pseudo code:
    # session.exec(update(DocumentDraft).where(DocumentDraft.employee_id==employee_id).values(**draft_flags, uploaded_at=datetime.utcnow()))
    # session.commit()

    return DraftResponse(message="Draft saved successfully!", saved_at=uploaded_at)


from models.request_log_model import RequestLog  # You need to create this model
from schemas.request_log_schema import RequestLogCreate, RequestLogResponse  # New schemas
from utils.email import send_document_request_email


from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Request
from sqlmodel import Session, select
from typing import List
from models.user_model import User
from models.document_model import Document
from models.request_log_model import RequestLog  # Import the new model
from schemas.request_log_schema import RequestLogCreate, RequestLogResponse  # Import schemas
from dependencies import get_session
from utils.email import send_document_request_email  # Import email utility
import logging
from datetime import datetime



@router.post("/request-doc", response_model=RequestLogResponse)
async def request_document(
    request: Request,
    session: Session = Depends(get_session)
):
    """Request document from employee with email notification and database logging"""
    try:
        body = await request.json()
        employee_id = body.get("employee_id")
        document_type = body.get("document_type", "General Document")
        
        if not employee_id:
            raise HTTPException(status_code=400, detail="employee_id is required")
        
        # Check if employee exists
        employee = session.get(User, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Create new request log entry
        new_log = RequestLog(
            employee_id=employee_id,
            requested_by=None,  # Set to None for now, or get from auth if available
            document_type=document_type,
            status="pending",
            requested_at=datetime.utcnow()
        )
        
        # Save to database
        session.add(new_log)
        session.commit()
        session.refresh(new_log)
        
        # Send email notification (fire and forget)
        employee_email = employee.company_email or employee.email
        if employee_email:
            # Use asyncio.create_task for fire-and-forget email sending
            import asyncio
            asyncio.create_task(
                send_document_request_email(
                    employee_email, 
                    employee.name, 
                    document_type
                )
            )
            logger.info(f"Email notification queued for {employee.name} at {employee_email}")
        else:
            logger.warning(f"No email found for employee {employee.name} (ID: {employee_id})")
        
        # Return response
        return RequestLogResponse(
            id=new_log.id,
            employee_id=new_log.employee_id,
            document_type=new_log.document_type,
            status=new_log.status,
            requested_at=new_log.requested_at
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        session.rollback()
        logger.error(f"Error in request_document: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/request-logs", response_model=List[RequestLogResponse])
def get_request_logs(session: Session = Depends(get_session)):
    """Get all document request logs"""
    try:
        # Fetch all request logs from database
        logs = session.exec(
            select(RequestLog).order_by(RequestLog.requested_at.desc())
        ).all()
        
        # Convert to response format
        return [
            RequestLogResponse(
                id=log.id,
                employee_id=log.employee_id,
                document_type=log.document_type,
                status=log.status,
                requested_at=log.requested_at
            ) for log in logs
        ]
        
    except Exception as e:
        logger.error(f"Error in get_request_logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# 2️⃣ Delete Candidate (DB + Azure Blob)
@router.delete("/delete/{employee_id}")
def delete_candidate(employee_id: int, session: Session = Depends(get_session)):
    # First delete all blobs
    blobs = container_client.list_blobs(name_starts_with=f"{employee_id}/")
    for blob in blobs:
        container_client.delete_blob(blob.name)

    # Then delete from documents table
    session.exec(select(Document).where(Document.employee_id == employee_id)).delete()
    
    # Then delete from users table
    emp = session.exec(select(User).where(User.id == employee_id)).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    session.delete(emp)

    session.commit()
    return {"message": f"Employee {employee_id} and documents deleted successfully"}

