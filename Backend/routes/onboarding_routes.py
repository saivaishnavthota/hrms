from models.onboarding_model import candidate,onboard_emp_doc
from fastapi import APIRouter, Depends, HTTPException,Request

from schemas.onboarding_schema import UserCreate,AssignEmployeeRequest,DocumentCreate,DocumentResponse,UsercreateResponse,EmployeeOnboardingRequest,EmployeeOnboardingResponse,DocumentStatus,EmployeeDocuments
from database import get_session
from fastapi.responses import JSONResponse,StreamingResponse
from utils.email import send_login_email,send_onboarding_email,send_credentials_email
from auth import get_current_user, create_access_token, verify_password, role_required, hash_password
from sqlalchemy.sql import text
from sqlmodel import Session, select
from models.user_model import User
import logging
import traceback
import psycopg2
import io
import secrets
import string
import filetype
from passlib.context import CryptContext
from typing import List, Optional

from azure.storage.blob import BlobServiceClient, ContentSettings
from datetime import datetime
from database import get_session
import os
from dotenv import load_dotenv
load_dotenv()


AZURE_CONNECTION_STRING =os.getenv("AZURE_CONNECTION_STRING", "DefaultEndpointsProtocol=https;AccountName=hrmsnxzen;AccountKey=Jug56pLmeZIJplobcV+f20v7IXnh6PWuih0hxRYpvRXpGh6tnJrzALqtqL/hRR3lpZK0ZTKIs2Pv+AStDvBH4w==;EndpointSuffix=core.windows.net")
AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME", "con-hrms")
blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
container_client = blob_service_client.get_container_client(AZURE_CONTAINER_NAME)

def build_blob_url(employee_id: int, file_name: str):
    return f"https://{blob_service_client.account_name}.blob.core.windows.net/{AZURE_CONTAINER_NAME}/{employee_id}/{file_name}"






router=APIRouter(prefix="/onboarding",tags=["onboarding"])


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/hr/create_employee",response_model=UsercreateResponse)
async def create_employee(
    user:UserCreate,
    session:Session=Depends(get_session),
    current_user: User =Depends(get_session)

):
    db_user = session.exec(select(User).where(User.email == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    query = text("SELECT add_employee(:name, :email ,:role,:type)")
    query = query.bindparams(name=user.name, email=user.email, role=user.role, type=user.type)
    temp_password = session.exec(query).scalar()

    session.commit() 

    if not temp_password:
        raise HTTPException(status_code=500, detail="Failed to create employee")

    new_user = session.exec(select(candidate).where(candidate.email == candidate.email)).first()
    if not new_user:
        raise HTTPException(status_code=500, detail="Failed to retrieve created employee")

    query_fetch = text("""
        SELECT *
        FROM onboarding_employees 
        WHERE email = :email
    """)
    result = session.exec(query_fetch.bindparams(email=user.email)).first()
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve created employee")

    await send_login_email(user.email, temp_password)

    return UsercreateResponse(
        id=result.id,
        name=result.name,
        email=result.email,
        message=f"Employee created successfully with ID: {result.id}"
    )


@router.post("/details", response_model=EmployeeOnboardingResponse)
async def onboard_employee(
    employee_data: EmployeeOnboardingRequest,
    session: Session = Depends(get_session)
):
    """
    Onboard a new employee by storing their details in the database
    using the emp_details stored procedure
    """
    try:
        logger.info(f"Starting onboarding process for employee ID: {employee_data.employee_id}")
        
        # Validate session
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        # Call the PostgreSQL function
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "SELECT emp_details(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);",
                (
                    employee_data.employee_id,
                    employee_data.full_name,
                    employee_data.contact_no,
                    employee_data.personal_email,
                   
                    employee_data.dob,
                    employee_data.address,
                    employee_data.gender,
                    employee_data.graduation_year,
                    employee_data.work_experience_years,
                    employee_data.emergency_contact_name,
                    employee_data.emergency_contact_number,
                    employee_data.emergency_contact_relation
                )
            )
            
             
           
            
        session.commit()
        logger.info(f"Successfully onboarded employee ID: {employee_data.employee_id}")
        
        return EmployeeOnboardingResponse(
            status="success",
            message="Employee onboarded successfully",
            employee_id=employee_data.employee_id
        )

    except Exception as e:
        session.rollback()
        logger.error(f"Error onboarding employee {employee_data.employee_id}: {str(e)}")
        
        # Handle specific database errors
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=400, 
                detail=f"Employee with ID {employee_data.employee_id} already exists"
            )
        elif "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Invalid employee ID or related data constraint violation"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Internal server error: {str(e)}"
            )



# Route: Upload Documents
@router.post("/upload")
async def upload_documents(request: Request, session: Session = Depends(get_session)):
    try:
        form_data = await request.form()
        logger.info(f"Received form data keys: {list(form_data.keys())}")

        employee_id = form_data.get("employeeId")
        if not employee_id:
            raise HTTPException(status_code=400, detail="employeeId is required")
        try:
            employee_id = int(employee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="employeeId must be an integer")

        uploaded_files = []

        for field_name, field_value in form_data.items():
            if field_name == "employeeId":
                continue

            if hasattr(field_value, "read") and hasattr(field_value, "filename"):
                file_data = await field_value.read()
                if not file_data:
                    logger.warning(f"File {field_name} is empty")
                    continue

                # Unique blob name → employeeId/docType/filename
                blob_name = f"{employee_id}/{field_name}/{field_value.filename}"

                # Upload to Azure
                blob_client = container_client.get_blob_client(blob_name)
                content_settings = ContentSettings(content_type=field_value.content_type)
                blob_client.upload_blob(file_data, overwrite=True, content_settings=content_settings)

                file_url = blob_client.url

                # Insert metadata into DB
                doc = onboard_emp_doc(
                    employee_id=employee_id,
                    doc_type=field_name,
                    file_name=field_value.filename,
                    file_url=file_url,
                    uploaded_at=datetime.utcnow()
                )
                session.add(doc)
                uploaded_files.append(
                    {"doc_type": field_name, "file_name": field_value.filename, "file_url": file_url}
                )

        if uploaded_files:
            session.commit()
            return {
                "message": f"Successfully uploaded {len(uploaded_files)} documents",
                "uploaded_files": uploaded_files,
                "employeeId": employee_id,
            }
        else:
            return {"message": "No files uploaded", "employeeId": employee_id}

    except Exception as e:
        session.rollback()
        logger.error(f"Error uploading documents: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Route: All Documents (across employees)
@router.get("/all-documents", response_model=List[EmployeeDocuments])
def all_documents(session: Session = Depends(get_session)):
    employees = session.query(User).all()
    result = []

    for emp in employees:
        docs = session.query(onboard_emp_doc).filter(onboard_emp_doc.employee_id == emp.id).all()
        doc_list = [
            DocumentStatus(
                doc_type=doc.doc_type,
                file_url=build_blob_url(emp.id, doc.file_name),
                uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None,
            )
            for doc in docs
        ]
        email = emp.company_email or emp.email or "no-email@company.com"
        result.append(
            EmployeeDocuments(
                id=emp.id,
                name=emp.name,
                email=email,
                role=emp.role,
                documents=doc_list,
            )
        )
    return result


# Route: Get Documents for Employee
@router.get("/emp/{employee_id}", response_model=List[DocumentStatus])
def list_documents(employee_id: int, session: Session = Depends(get_session)):
    documents = session.query(onboard_emp_doc).filter(onboard_emp_doc.employee_id == employee_id).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this employee")

    return [
        DocumentStatus(
            doc_type=doc.doc_type,
            file_url=build_blob_url(employee_id, doc.file_name),
            uploaded_at=doc.uploaded_at.strftime("%d-%m-%Y") if doc.uploaded_at else None,
        )
        for doc in documents
    ]


# Route: Preview Single Document
@router.get("/doc/{employee_id}/{doc_type}", response_model=DocumentStatus)
def preview_document(employee_id: int, doc_type: str, session: Session = Depends(get_session)):
    document = session.query(onboard_emp_doc).filter(
        onboard_emp_doc.employee_id == employee_id, onboard_emp_doc.doc_type == doc_type
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail=f"No {doc_type} found for this employee")

    return DocumentStatus(
        doc_type=document.doc_type,
        file_url=build_blob_url(employee_id, document.file_name),
        uploaded_at=document.uploaded_at.strftime("%d-%m-%Y") if document.uploaded_at else None,
    )


# # Route: Save Draft Flags
# @router.post("/save-draft", response_model=DraftResponse)
# async def save_draft(
#     employee_id: int = Form(...),
#     updated_resume: Optional[bool] = Form(False),
#     offer_letter: Optional[bool] = Form(False),
#     latest_compensation_letter: Optional[bool] = Form(False),
#     experience_relieving_letter: Optional[bool] = Form(False),
#     latest_3_months_payslips: Optional[bool] = Form(False),
#     form16_or_12b_or_taxable_income: Optional[bool] = Form(False),
#     ssc_certificate: Optional[bool] = Form(False),
#     hsc_certificate: Optional[bool] = Form(False),
#     hsc_marksheet: Optional[bool] = Form(False),
#     graduation_marksheet: Optional[bool] = Form(False),
#     latest_graduation_certificate: Optional[bool] = Form(False),
#     postgraduation_marksheet: Optional[bool] = Form(False),
#     postgraduation_certificate: Optional[bool] = Form(False),
#     aadhar: Optional[bool] = Form(False),
#     pan: Optional[bool] = Form(False),
#     passport: Optional[bool] = Form(False),
#     session: Session = Depends(get_session),
# ):
#     uploaded_at = datetime.utcnow()

#     # Save as draft → update DB flags table
#     draft_flags = {
#         "updated_resume": updated_resume,
#         "offer_letter": offer_letter,
#         "latest_compensation_letter": latest_compensation_letter,
#         "experience_relieving_letter": experience_relieving_letter,
#         "latest_3_months_payslips": latest_3_months_payslips,
#         "form16_or_12b_or_taxable_income": form16_or_12b_or_taxable_income,
#         "ssc_certificate": ssc_certificate,
#         "hsc_certificate": hsc_certificate,
#         "hsc_marksheet": hsc_marksheet,
#         "graduation_marksheet": graduation_marksheet,
#         "latest_graduation_certificate": latest_graduation_certificate,
#         "postgraduation_marksheet": postgraduation_marksheet,
#         "postgraduation_certificate": postgraduation_certificate,
#         "aadhar": aadhar,
#         "pan": pan,
#         "passport": passport,
#     }

#     for doc_type, flag in draft_flags.items():
#         if flag:
#             existing = session.query(Document).filter(
#                 Document.employee_id == employee_id, Document.doc_type == doc_type
#             ).first()
#             if not existing:
#                 doc = Document(
#                     employee_id=employee_id,
#                     doc_type=doc_type,
#                     file_name=None,
#                     file_url=None,
#                     uploaded_at=uploaded_at,
#                 )
#                 session.add(doc)

#     session.commit()
#     return DraftResponse(employee_id=employee_id, uploaded_at=uploaded_at.strftime("%d-%m-%Y"))


# Get employee details endpoint
@router.get("/details/{employee_id}")
async def get_employee_details(
    employee_id: int,
    session: Session = Depends(get_session)
):
    """
    Retrieve employee details by employee ID
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        with session.connection().connection.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    employee_id, full_name, contact_no, personal_email, 
                    doj, dob, address, gender, graduation_year, 
                    work_experience_years, emergency_contact_name, 
                    emergency_contact_number, emergency_contact_relation,
                    created_at
                FROM onboarding_emp_details 
                WHERE employee_id = %s
                """,
                (employee_id,)
            )
            
            result = cur.fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Convert result to dictionary
            columns = [
                'employee_id', 'full_name', 'contact_no', 'personal_email',
                'doj', 'dob', 'address', 'gender', 'graduation_year',
                'work_experience_years', 'emergency_contact_name',
                'emergency_contact_number', 'emergency_contact_relation',
                'created_at'
            ]
            
            employee_data = dict(zip(columns, result))
            
            return {
                "status": "success",
                "data": employee_data
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/all")
async def get_all_onboarding_employees(session: Session = Depends(get_session)):
    """
    Retrieve all employees from the onboarding_employees table
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        with session.connection().connection.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    id,  INITCAP(name) as name, email, role, type, o_status
                FROM onboarding_employees
               
                """
            )
            
            results = cur.fetchall()
            
            if not results:
                return {
                    "status": "success",
                    "data": []
                }

            columns = ['id', 'name', 'email', 'role', 'type','o_status']
            employees = [dict(zip(columns, row)) for row in results]

            return {
                "status": "success",
                "count": len(employees),
                "data": employees
            }

    except Exception as e:
        logger.error(f"Error retrieving onboarding employees: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/hr/approve/{onboarding_id}")
async def approve_employee(onboarding_id: int, session: Session = Depends(get_session)):
    """
    Approve an employee:
    - Moves data from onboarding tables to main tables
    - Calls the stored procedure approve_employee(onboarding_id, OUT new_emp_id)
    """
    try:
        with session.connection().connection.cursor() as cur:
            # Call the stored procedure
            cur.execute("CALL approve_employee(%s, %s)", (onboarding_id, None))

            # Fetch OUT parameter if needed (depends how your procedure is written)
            # Some drivers don’t return OUT params directly, so you can SELECT instead.
            # Example if your procedure inserts into employees and returns new id:
            cur.execute("SELECT currval(pg_get_serial_sequence('employees','id'))")
            new_emp_id = cur.fetchone()[0]

        session.commit()
        return {
            "status": "success",
            "message": f"Employee {onboarding_id} approved successfully",
            "new_employee_id": new_emp_id
        }

    except Exception as e:
        session.rollback()
        logger.error(f"Error approving employee {onboarding_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error approving employee: {str(e)}")

@router.post("/hr/assign")
async def assign_employee(data: AssignEmployeeRequest, session: Session = Depends(get_session)):
    try:
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "CALL assign_employee(%s, %s, %s, %s, %s, %s)",
                (
                    data.employee_id,
                    data.location_id,
                    data.doj,
                    data.company_email,
                    [data.manager1_id, data.manager2_id, data.manager3_id],
                    [data.hr1_id, data.hr2_id],
                )
            )
        temp_password = generate_temp_password()
        hashed_password = hash_password(temp_password)

        # Store hashed password in employees table
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "UPDATE employees SET password_hash = %s WHERE id = %s",
                (hashed_password, data.employee_id)
            )
        
        session.commit()
        with session.connection().connection.cursor() as cur:
            cur.execute("SELECT name FROM locations WHERE id = %s", (data.location_id,))
            location_row = cur.fetchone()
        location_name = location_row[0] if location_row else "Not Assigned"

        await send_credentials_email(
            to_email=data.to_email,
            company_email=data.company_email,
            temp_password=temp_password,  # send plain text
            location=location_name,
            doj=str(data.doj)
        )
        return {
            "status": "success",
            "message": f"Employee {data.employee_id} assigned and credentials emailed"
        }

    except Exception as e:
        session.rollback()
        logger.error(f"Error assigning employee {data.employee_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error assigning employee: {str(e)}")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

# Hash password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

