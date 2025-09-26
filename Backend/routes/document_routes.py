from fastapi import APIRouter, UploadFile, File, HTTPException, Depends,Form,Request
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
from schemas.document_schema import DocumentCreate, DocumentResponse, DraftResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_documents(
    request: Request,
    session: Session = Depends(get_session)
):
    try:
        # Parse the multipart form data
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
        
        uploaded_files = {}
        
        with session.connection().connection.cursor() as cur:
            # Iterate through all form fields
            for field_name, field_value in form_data.items():
                # Skip non-file fields
                if field_name == "employeeId":
                    continue
                
                logger.info(f"Processing field: {field_name}, type: {type(field_value)}")
                
                # Check if it's a file upload
                if hasattr(field_value, 'read') and hasattr(field_value, 'filename'):
                    if hasattr(field_value, 'size') and field_value.size > 0:
                        logger.info(f"Uploading file: {field_value.filename} for field: {field_name}")
                        file_data = await field_value.read()
                        
                        # Execute the stored procedure
                        cur.execute(
                            "SELECT upload_document(%s, %s, %s);",
                            (employee_id, field_name, psycopg2.Binary(file_data))
                        )
                        result = cur.fetchone()
                        logger.info(f"Database result for {field_name}: {result}")
                        
                        uploaded_files[field_name] = field_value.filename
                    else:
                        logger.warning(f"File {field_name} is empty or has no size attribute")
        
        # Only commit if we actually uploaded files
        if uploaded_files:
            session.commit()
            logger.info(f"Successfully committed {len(uploaded_files)} files")
        else:
            logger.warning("No files were uploaded")
        
        return {
            "message": f"Successfully uploaded {len(uploaded_files)} documents",
            "uploaded_files": uploaded_files,
            "employeeId": employee_id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error uploading documents: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# def get_session():
#        # Your session creation logic here
#        pass

@router.get("/all-documents")
def all_documents(session: Session = Depends(get_session)):
    employees = session.exec(select(User)).all()  # fetch all employees
    result = []

    for emp in employees:
        doc = session.exec(select(Document).where(Document.employee_id == emp.id)).first()
        documents_status = {}

        if doc:
            doc_fields = [
                "aadhar",
                "pan",
                "latest_graduation_certificate",
                "updated_resume",
                "offer_letter",
                "latest_compensation_letter",
                "experience_relieving_letter",
                "latest_3_months_payslips",
                "form16_or_12b_or_taxable_income",
                "ssc_certificate",
                "hsc_certificate",
                "hsc_marksheet",
                "graduation_marksheet",
                "postgraduation_marksheet",
                "postgraduation_certificate",
                "passport",
            ]
            # True = uploaded, False = not uploaded
            documents_status = {field: bool(getattr(doc, field, None)) for field in doc_fields}

        result.append({
            "id": emp.id,
            "name": emp.name,
            "email": emp.company_email,
            "role": emp.role,
            "documents": documents_status
        })

    return result
    
@router.get("/emp/{employee_id}")
def list_documents(employee_id: int, session: Session = Depends(get_session)):
    document = session.exec(
        select(Document).where(Document.employee_id == employee_id)
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="No documents found for this employee")

    # List all document columns
    doc_fields = [
        "aadhar",
        "pan",
        "latest_graduation_certificate",
        "updated_resume",
        "offer_letter",
        "latest_compensation_letter",
        "experience_relieving_letter",
        "latest_3_months_payslips",
        "form16_or_12b_or_taxable_income",
        "ssc_certificate",
        "hsc_certificate",
        "hsc_marksheet",
        "graduation_marksheet",
        "postgraduation_marksheet",
        "postgraduation_certificate",
        "passport",
    ]

    response = {field: True if getattr(document, field) else False for field in doc_fields}
    response["employeeId"] = employee_id
    response["uploaded_at"] = document.uploaded_at.strftime("%d-%m-%Y")

    return response




@router.get("/{employee_id}/{doc_type}")
def preview_document(employee_id: int, doc_type: str, session: Session = Depends(get_session)):
    document = session.exec(
        select(Document).where(Document.employee_id == employee_id)
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="No documents found for this employee")

    valid_fields = {
        "aadhar": "aadhar.pdf",
        "pan": "pan.pdf",
        "latest_graduation_certificate": "graduation_certificate.pdf",
        "updated_resume": "resume.pdf",
        "offer_letter": "offer_letter.pdf",
        "latest_compensation_letter": "compensation_letter.pdf",
        "experience_relieving_letter": "relieving_letter.pdf",
        "latest_3_months_payslips": "payslips.pdf",
        "form16_or_12b_or_taxable_income": "form16.pdf",
        "ssc_certificate": "ssc_certificate.pdf",
        "hsc_certificate": "hsc_certificate.pdf",
        "hsc_marksheet": "hsc_marksheet.pdf",
        "graduation_marksheet": "graduation_marksheet.pdf",
        "postgraduation_marksheet": "pg_marksheet.pdf",
        "postgraduation_certificate": "pg_certificate.pdf",
        "passport": "passport.pdf",
    }

    if doc_type not in valid_fields:
        raise HTTPException(status_code=400, detail="Invalid document type")

    file_data = getattr(document, doc_type)
    if not file_data:
        raise HTTPException(status_code=404, detail=f"{doc_type} not uploaded")

    # Inline preview instead of download
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type="application/pdf",  # Change to "image/jpeg" or "image/png" for images
        headers={"Content-Disposition": f"inline; filename={valid_fields[doc_type]}"}
    )
    
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
):


    """
    Save the document draft status for an employee.
    Only stores true/false flags for each document.
    """

    # Here, you would normally update the database
    # Example pseudo code:
    draft_data = {
        "employee_id": employee_id,
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
        "uploaded_at": uploaded_at
    }

   
    return DraftResponse(message="Draft saved successfully!",saved_at=uploaded_at)