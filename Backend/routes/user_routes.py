from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from models.user_model import User
from models.onboarding_model import candidate
from schemas.user_schema import ResetPasswordResponse,ResetOnboardingPasswordRequest,UseronboardingResponse,UserCreate,VerifyOtpRequest,ChangePasswordRequest,ApproveDocsRequest,UsercreateResponse,UserHrAccept,HrApproveRequest, UserResponse, UserLogin, EmployeeOnboardingRequest,EmployeeOnboardingResponse,ResetPasswordRequest,EmployeeOnboardingRequest, ForgotPasswordRequest,Employee,AssignRequest,AssignResponse
from schemas.employee_create_schema import EmployeeCreateRequest, EmployeeUpdateRequest, EmployeeResponse, EmployeeDeleteResponse
from utils.email import send_login_email,send_onboarding_email,forgot_password_mail
from auth import get_current_user, create_access_token, verify_password, role_required, hash_password
from database import get_session
from datetime import datetime, timedelta
from sqlalchemy.sql import text
from models.employee_master_model import EmployeeMaster
from models.employee_details_model import EmployeeDetails, Location
from models.employee_assignment_model import EmployeeHR, EmployeeManager
from schemas.employee_master_schema import EmployeeMasterCreate, EmployeeMasterResponse
import logging
from utils.hash_utils import hash_password
import random
from typing import Union
from fastapi.security import OAuth2PasswordRequestForm
from utils.redis_client import redis_client
from utils.session_utils import create_session, invalidate_session

router = APIRouter(prefix="/users", tags=["Users"])


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



@router.post("/hr/approve", response_model=UserHrAccept)
async def hr_accept(data: HrApproveRequest, session: Session = Depends(get_session)):
    # Find employee
    user = db.query(users).filter(users.id == data.employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Update onboarding status
    employee.o_status = True
    session.commit()
    session.refresh(employee)

    return UserHrAccept(
        employee_id=employee.id,
        o_status=employee.o_status,
        message="Employee onboarding approved by HR"
    )

@router.post("/login", response_model=Union[UserResponse, UseronboardingResponse])
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    email = form_data.username.strip().lower()
    password = form_data.password.strip()
    
    # ✅ Case 1: Onboarded User
    db_user = session.exec(select(User).where(User.company_email == email)).first()
    if db_user:
        if not verify_password(password, db_user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        #session_id, expires_at = create_session(db_user.id, db_user.role, "user", session)

        access_token = create_access_token(
            data={"sub": db_user.company_email, "role": db_user.role},
            expires_delta=timedelta(minutes=60)
        )

        return UserResponse(
            employeeId=db_user.id,
            name=db_user.name,
            role=db_user.role,
            email=db_user.company_email,
            company_employee_id=db_user.company_employee_id,
            access_token=access_token,
            onboarding_status=db_user.o_status,
            login_status=db_user.login_status,
            type=db_user.role,
            location_id=db_user.location_id,
            message=f"Welcome, {db_user.name}!"
        )

    # ✅ Case 2: Candidate
    onboarding_user = session.exec(select(candidate).where(candidate.email == email)).first()
    if onboarding_user:
        if not verify_password(password, onboarding_user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        session_id, expires_at = create_session(onboarding_user.id, onboarding_user.role, "candidate", session)

        access_token = create_access_token(
            data={"sub": onboarding_user.email, "session_id": session_id, "role": onboarding_user.role},
            expires_delta=timedelta(minutes=60)
        )

        return UseronboardingResponse(
            employeeId=onboarding_user.id,
            name=onboarding_user.name,
            email=onboarding_user.email,
            onboarding_status=onboarding_user.o_status,
            login_status=onboarding_user.login_status,
            role=onboarding_user.role,
            access_token=access_token,
            type=onboarding_user.role,
        )

    raise HTTPException(status_code=404, detail="User not found")

@router.post("/reset-onboarding-password")
async def reset_onboarding_password(
    req: ResetOnboardingPasswordRequest,
    session: Session = Depends(get_session),
):
    onboarding_user = session.get(candidate, req.employee_id)
    if not onboarding_user:
        raise HTTPException(status_code=404, detail="Onboarding employee not found")

    # Hash password
    hashed_pwd = hash_password(req.new_password)

    onboarding_user.password = hashed_pwd
    onboarding_user.login_status = True
    session.commit()
   
    return {"status": "success", "message": "Password set successfully. Please login again."}

# ----------------------------
# Reset Password
# ----------------------------

from utils.hash_utils import hash_password  # make sure you use hashing (bcrypt, passlib)
@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest, session: Session = Depends(get_session)):
    """
    Verify the OTP sent to the user's email
    """
    try:
        employee = session.exec(
            select(User).where(User.email == req.email.lower())
        ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        if employee.reset_otp != req.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")

       

        # Mark as verified (you can also store a flag in DB like otp_verified=True)
        return {"status": "success", "message": "OTP verified successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
async def change_password(req: ChangePasswordRequest, session: Session = Depends(get_session)):
    """
    Change password after OTP verification
    """
    try:
        # Try matching by company_email first (frontend may submit company email),
        # then fallback to personal email.
        employee = session.exec(
            select(User).where(User.company_email == req.email.lower())
        ).first()

        if not employee:
            employee = session.exec(
                select(User).where(User.email == req.email.lower())
            ).first()

        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        # Optional: you can require otp_verified flag here if you set it in verify_otp
        employee.password_hash = hash_password(req.new_password)
        employee.reset_otp = None
        # Some deployments may not have an expires_at column; avoid setting non-existent attributes.
        # Ensure the user can log in after setting the password during onboarding.
        employee.login_status = True

        session.add(employee)
        session.commit()
        session.refresh(employee)

        return {"status": "success", "message": "Password updated successfully"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    try:
        employee = session.exec(select(User).where(User.email == req.email.lower())).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Email not found")

        # Generate OTP
        otp = str(random.randint(100000, 999999))
        employee.reset_otp = otp
         # expires in 10 min

        session.add(employee)
        session.commit()
        session.refresh(employee)

        # Send OTP via email
        email_sent = await forgot_password_mail(req.email, f"Your OTP is {otp}")
        if not email_sent:
            raise HTTPException(status_code=500, detail="Failed to send email")

        return {"status": "success", "message": f"OTP sent to {req.email}"}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/reset-password", response_model=ResetPasswordResponse)
def change_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    employee = session.exec(
        select(User).where(User.company_email == req.email.lower())
    ).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Email not found")

    # Verify old password
    if not verify_password(req.currentPassword, employee.password_hash):
        raise HTTPException(status_code=400, detail="Invalid old password")

    # Update password
    employee.password_hash = hash_password(req.new_password)
    employee.login_status = True  # Set login status to true after password change
    session.add(employee)
    session.commit()
    session.refresh(employee)

    return {"status": "success", "message": "Password changed successfully"}


@router.get("/managers")
async def display_managers(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "Manager")
    managers = session.exec(statement).all()
    manager_list = [{"id": m[0], "name": m[1]} for m in managers]
    return {"managers": manager_list}

# ----------------------------
# Get all HRs
# ----------------------------
@router.get("/hrs")
async def display_hrs(session: Session = Depends(get_session)):
    statement = select(User.id, User.name).where(User.role == "HR")
    hrs = session.exec(statement).all()
    hr_list = [{"id": h[0], "name": h[1]} for h in hrs]
    return {"HRs": hr_list}

# ----------------------------
# Get all employees with their assigned HRs and Managers
# ----------------------------
@router.get("/employees")
async def display_employees(hr_id: int = None, session: Session = Depends(get_session)):
    """
    Get all employees with their assigned HRs and Managers.
    If `hr_id` is provided, filter employees assigned to that HR.
    """
    try:
        base_query = """
            SELECT
                e.id AS employeeId,
                INITCAP(e.name) AS name,
                e.company_email,
                e.email,
                e.role,
                e.company_employee_id,
                e.reassignment,
                COALESCE(array_agg(DISTINCT hr.name) FILTER (WHERE hr.id IS NOT NULL), '{}') AS hr,
                COALESCE(array_agg(DISTINCT mgr.name) FILTER (WHERE mgr.id IS NOT NULL), '{}') AS managers
            FROM employees e
            LEFT JOIN employee_hrs eh ON e.id = eh.employee_id
            LEFT JOIN employees hr ON eh.hr_id = hr.id
            LEFT JOIN employee_managers em ON e.id = em.employee_id
            LEFT JOIN employees mgr ON em.manager_id = mgr.id
        """

        # Filter by hr_id if provided
        if hr_id:
            base_query += " WHERE eh.hr_id = :hr_id"

        base_query += " GROUP BY e.id, e.name, e.email, e.role, e.company_employee_id, e.reassignment ORDER BY e.name"

        result = session.execute(text(base_query), {"hr_id": hr_id} if hr_id else {}).all()
        
        employees = []
        for row in result:
            employees.append({
                "employeeId": row.employeeid,
                "name": row.name,
                "to_email": row.email,
                "email": row.company_email,
                "role": row.role,
                "company_employee_id": row.company_employee_id,
                "reassignment": row.reassignment,
                "hr": row.hr,
                "managers": row.managers
            })

        return {"count": len(employees), "employees": employees}

    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Get all onboarded employees with document status
# -----------------------------------------------
@router.get("/onboarded-employees")
async def get_onboarded_employees(session: Session = Depends(get_session)):
    """
    Fetch all onboarded employees (employees who have completed onboarding process)
    with their document status and additional details for the OnboardedEmployees component
    """
    try:
        query = text("""
            SELECT
                u.id,
                INITCAP(u.name) as name,
                u.company_email as email,
                u.email as personal_email,
                u.role,
                u.employment_type as type,
                CASE 
                    WHEN u.o_status = true THEN 'Active'
                    ELSE 'Pending'
                END as status,
                u.created_at,
                u.location_id,
                l.name as location_name,
                u.doj,
                -- Get document counts from emp_doc table
                COALESCE(doc_count.total_docs, 0) as document_count,
                -- Collect HR names linked to the employee
                COALESCE(array_agg(DISTINCT hr.name) FILTER (WHERE hr.id IS NOT NULL), '{}') AS hr,
                -- Collect Manager names linked to the employee
                COALESCE(array_agg(DISTINCT mgr.name) FILTER (WHERE mgr.id IS NOT NULL), '{}') AS managers
            FROM employees u
            LEFT JOIN locations l ON u.location_id = l.id
            LEFT JOIN (
                SELECT 
                    employee_id,
                    (CASE WHEN aadhar IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN pan IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN latest_graduation_certificate IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN updated_resume IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN offer_letter IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN latest_compensation_letter IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN experience_relieving_letter IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN latest_3_months_payslips IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN form16_or_12b_or_taxable_income IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN ssc_certificate IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN hsc_certificate IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN hsc_marksheet IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN graduation_marksheet IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN postgraduation_marksheet IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN postgraduation_certificate IS NOT NULL THEN 1 ELSE 0 END +
                     CASE WHEN passport IS NOT NULL THEN 1 ELSE 0 END) as total_docs
                FROM documents
            ) doc_count ON u.id = doc_count.employee_id
            LEFT JOIN employee_hrs eh ON u.id = eh.employee_id
            LEFT JOIN employees hr ON eh.hr_id = hr.id
            LEFT JOIN employee_managers em ON u.id = em.employee_id
            LEFT JOIN employees mgr ON em.manager_id = mgr.id
            WHERE u.o_status = true  -- Only onboarded employees
            GROUP BY u.id, u.name, u.company_email, u.email, u.role, u.employment_type, u.o_status, u.created_at, u.location_id, l.name, u.doj, doc_count.total_docs
            ORDER BY u.created_at DESC;
        """)

        result = session.execute(query).all()
        employees = []
        
        for row in result:
            # Generate avatar initials from name
            name_parts = row.name.split()
            avatar = ''.join([part[0].upper() for part in name_parts[:2]]) if name_parts else 'NA'
            
            employees.append({
                "id": row.id,
                "name": row.name,
                "email": row.email,
                "personal_email": row.personal_email,
                "type": row.type or "Full-time",
                "role": row.role,
                "status": row.status,
                "avatar": avatar,
                "document_count": row.document_count,
                "location_id": row.location_id,
                "location_name": row.location_name,
                "doj": row.doj.isoformat() if row.doj else None,
                "hr": row.hr if row.hr else [],
                "managers": row.managers if row.managers else [],
                "created_at": row.created_at.isoformat() if row.created_at else None
            })

        return {
            "status": "success",
            "count": len(employees),
            "data": employees
        }

    except Exception as e:
        logger.error(f"Error fetching onboarded employees: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Get documents for a specific onboarded employee
# ----------------------------------------------
@router.get("/onboarded-employees/{employee_id}/documents")
async def get_employee_documents(employee_id: int, session: Session = Depends(get_session)):
    """
    Fetch document details for a specific onboarded employee
    """
    try:
        # Check if employee exists and is onboarded
        employee_query = text("""
            SELECT id, name, company_email 
            FROM employees 
            WHERE id = :employee_id AND o_status = true
        """)
        
        employee_result = session.execute(employee_query, {"employee_id": employee_id}).first()
        
        if not employee_result:
            raise HTTPException(
                status_code=404, 
                detail="Onboarded employee not found"
            )

        # Get document information
        doc_query = text("""
            SELECT 
                aadhar, pan, latest_graduation_certificate, updated_resume,
                offer_letter, latest_compensation_letter, experience_relieving_letter,
                latest_3_months_payslips, form16_or_12b_or_taxable_income,
                ssc_certificate, hsc_certificate, hsc_marksheet,
                graduation_marksheet, postgraduation_marksheet, 
                postgraduation_certificate, passport, uploaded_at
            FROM documents 
            WHERE employee_id = :employee_id
        """)
        
        doc_result = session.execute(doc_query, {"employee_id": employee_id}).first()
        
        documents = []
        if doc_result:
            doc_fields = {
                "aadhar": "Aadhar Card",
                "pan": "PAN Card", 
                "latest_graduation_certificate": "Graduation Certificate",
                "updated_resume": "Resume",
                "offer_letter": "Offer Letter",
                "latest_compensation_letter": "Compensation Letter",
                "experience_relieving_letter": "Experience Letter",
                "latest_3_months_payslips": "Payslips",
                "form16_or_12b_or_taxable_income": "Tax Documents",
                "ssc_certificate": "SSC Certificate",
                "hsc_certificate": "HSC Certificate", 
                "hsc_marksheet": "HSC Marksheet",
                "graduation_marksheet": "Graduation Marksheet",
                "postgraduation_marksheet": "Post Graduation Marksheet",
                "postgraduation_certificate": "Post Graduation Certificate",
                "passport": "Passport"
            }
            
            doc_id = 1
            for field, display_name in doc_fields.items():
                if getattr(doc_result, field):
                    documents.append({
                        "id": doc_id,
                        "name": f"{display_name}.pdf",
                        "type": display_name,
                        "url": f"/documents/{employee_id}/{field}",
                        "uploadDate": doc_result.uploaded_at.strftime("%Y-%m-%d") if doc_result.uploaded_at else None
                    })
                    doc_id += 1

        return {
            "status": "success",
            "employee": {
                "id": employee_result.id,
                "name": employee_result.name,
                "email": employee_result.company_email
            },
            "documents": documents
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching documents for employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Get employee details endpoint
@router.get("/employee/{employee_id}")
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
                FROM employee_details 
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

# Update employee details endpoint
@router.put("/employee/{employee_id}")
async def update_employee_details(
    employee_id: int,
    employee_data: EmployeeOnboardingRequest,
    session: Session = Depends(get_session)
):
    """
    Update existing employee details
    """
    try:
        if session is None:
            raise HTTPException(status_code=500, detail="Database session is not available")

        # Check if employee exists
        with session.connection().connection.cursor() as cur:
            cur.execute(
                "SELECT employee_id FROM employee_details WHERE employee_id = %s",
                (employee_id,)
            )
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail=f"Employee with ID {employee_id} not found"
                )
            
            # Update employee details
            cur.execute(
                """
                UPDATE employee_details SET
                    full_name = %s,
                    contact_no = %s,
                    personal_email = %s,
                    doj = %s,
                    dob = %s,
                    address = %s,
                    gender = %s,
                    graduation_year = %s,
                    work_experience_years = %s,
                    emergency_contact_name = %s,
                    emergency_contact_number = %s,
                    emergency_contact_relation = %s,
                    updated_at = NOW()
                WHERE employee_id = %s
                """,
                (
                    employee_data.full_name,
                    employee_data.contact_no,
                    employee_data.personal_email,
                    employee_data.doj,
                    employee_data.dob,
                    employee_data.address,
                    employee_data.gender,
                    employee_data.graduation_year,
                    employee_data.work_experience_years,
                    employee_data.emergency_contact_name,
                    employee_data.emergency_contact_number,
                    employee_data.emergency_contact_relation,
                    employee_id
                )
            )
            
        session.commit()
        logger.info(f"Successfully updated employee ID: {employee_id}")
        
        return {
            "status": "success",
            "message": "Employee details updated successfully",
            "employee_id": employee_id
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

#changed
@router.get("/{employee_id}")
def get_employee_profile(employee_id: int, session: Session = Depends(get_session)):
    # employee core info
    employee = session.exec(select(User).where(User.id == employee_id)).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # managers and HRs from EmployeeMaster
    master = session.exec(select(EmployeeMaster).where(EmployeeMaster.emp_id == employee_id)).first()
    managers = []
    hrs = []

    if master:
        # managers from master table
        for mid in [master.manager1_id, master.manager2_id, master.manager3_id]:
            if mid:
                mgr = session.exec(select(User).where(User.id == mid)).first()
                if mgr:
                    managers.append(mgr.name)
        # HRs from master table
        for hid in [master.hr1_id, master.hr2_id]:
            if hid:
                hr = session.exec(select(User).where(User.id == hid)).first()
                if hr:
                    hrs.append(hr.name)

    # extra managers from EmployeeManager table
    extra_managers = session.exec(select(EmployeeManager).where(EmployeeManager.employee_id == employee_id)).all()
    for m in extra_managers:
        mgr = session.exec(select(User).where(User.id == m.manager_id)).first()
        if mgr and mgr.name not in managers:
            managers.append(mgr.name)

    # extra HRs from EmployeeHR table
    extra_hrs = session.exec(select(EmployeeHR).where(EmployeeHR.employee_id == employee_id)).all()
    for h in extra_hrs:
        hr = session.exec(select(User).where(User.id == h.hr_id)).first()
        if hr and hr.name not in hrs:
            hrs.append(hr.name)

    details = session.exec(select(EmployeeDetails).where(EmployeeDetails.employee_id == employee_id)).first()

    location_name = None
    if employee.location_id:
        location = session.exec(select(Location).where(Location.id == employee.location_id)).first()
        if location:
            location_name = location.name

    # full profile
    return {
            "id": employee.id,
            "name": employee.name,
            "email": employee.email,
            "company_email": employee.company_email,
            "role": employee.role,
            "onboarding_status": employee.o_status,
            "managers": managers,
            "hrs": hrs,
            "employmentType": employee.employment_type if details else None,
            "contactNumber": details.contact_no if details else None,
            "dateOfJoining": employee.doj if details else None,
            "location": location_name
        }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user

# Create new employee endpoint
@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreateRequest,
    session: Session = Depends(get_session)
):
    """
    Create a new employee with basic information and optional details
    """
    try:
        # Check if email already exists
        existing_user = session.exec(select(User).where(User.email == employee_data.email)).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Employee with this email already exists"
            )
        
        # Create new user/employee
        new_employee = User(
            name=employee_data.name,
            email=employee_data.email,
            company_email=employee_data.company_email or employee_data.email,
            role=employee_data.role,
            employment_type=employee_data.employment_type,
            location_id=employee_data.location_id,
            doj=employee_data.doj,
            o_status=False,  # New employees start as not onboarded
            login_status=False,
            password_hash=hash_password("temp123")  # Temporary password
        )
        
        session.add(new_employee)
        session.commit()
        session.refresh(new_employee)
        
        # Create employee details if provided
        if any([
            employee_data.full_name, employee_data.contact_no, employee_data.personal_email,
            employee_data.dob, employee_data.address, employee_data.gender,
            employee_data.graduation_year, employee_data.work_experience_years,
            employee_data.emergency_contact_name, employee_data.emergency_contact_number,
            employee_data.emergency_contact_relation
        ]):
            employee_details = EmployeeDetails(
                employee_id=new_employee.id,
                full_name=employee_data.full_name or employee_data.name,
                contact_no=employee_data.contact_no,
                personal_email=employee_data.personal_email,
                company_email=employee_data.company_email or employee_data.email,
                doj=employee_data.doj,
                dob=employee_data.dob,
                address=employee_data.address,
                gender=employee_data.gender,
                graduation_year=employee_data.graduation_year,
                work_experience_years=employee_data.work_experience_years or 0,
                emergency_contact_name=employee_data.emergency_contact_name,
                emergency_contact_number=employee_data.emergency_contact_number,
                emergency_contact_relation=employee_data.emergency_contact_relation,
                employment_type=employee_data.employment_type
            )
            
            session.add(employee_details)
            session.commit()
        
        # Get location name if location_id is provided
        location_name = None
        if new_employee.location_id:
            location = session.exec(select(Location).where(Location.id == new_employee.location_id)).first()
            if location:
                location_name = location.name
        
        logger.info(f"Successfully created employee ID: {new_employee.id}")
        
        return EmployeeResponse(
            id=new_employee.id,
            name=new_employee.name,
            email=new_employee.email,
            company_email=new_employee.company_email,
            role=new_employee.role,
            employment_type=new_employee.employment_type,
            location_id=new_employee.location_id,
            location_name=location_name,
            doj=new_employee.doj,
            o_status=new_employee.o_status,
            login_status=new_employee.login_status,
            created_at=new_employee.created_at.isoformat() if new_employee.created_at else None,
            full_name=employee_data.full_name,
            contact_no=employee_data.contact_no,
            personal_email=employee_data.personal_email,
            dob=employee_data.dob,
            address=employee_data.address,
            gender=employee_data.gender,
            graduation_year=employee_data.graduation_year,
            work_experience_years=employee_data.work_experience_years,
            emergency_contact_name=employee_data.emergency_contact_name,
            emergency_contact_number=employee_data.emergency_contact_number,
            emergency_contact_relation=employee_data.emergency_contact_relation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating employee: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Update employee endpoint
@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdateRequest,
    session: Session = Depends(get_session)
):
    """
    Update existing employee information
    """
    try:
        # Check if employee exists
        employee = session.exec(select(User).where(User.id == employee_id)).first()
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        # Update user/employee basic info
        if employee_data.name is not None:
            employee.name = employee_data.name
        if employee_data.email is not None:
            # Check if new email already exists for another user
            existing_user = session.exec(
                select(User).where(User.email == employee_data.email, User.id != employee_id)
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email already exists for another employee"
                )
            employee.email = employee_data.email
        if employee_data.company_email is not None:
            employee.company_email = employee_data.company_email
        if employee_data.role is not None:
            employee.role = employee_data.role
        if employee_data.employment_type is not None:
            employee.employment_type = employee_data.employment_type
        if employee_data.location_id is not None:
            employee.location_id = employee_data.location_id
        if employee_data.doj is not None:
            employee.doj = employee_data.doj
        
        session.add(employee)
        session.commit()
        session.refresh(employee)
        
        # Update or create employee details
        employee_details = session.exec(
            select(EmployeeDetails).where(EmployeeDetails.employee_id == employee_id)
        ).first()
        
        if employee_details:
            # Update existing details
            if employee_data.full_name is not None:
                employee_details.full_name = employee_data.full_name
            if employee_data.contact_no is not None:
                employee_details.contact_no = employee_data.contact_no
            if employee_data.personal_email is not None:
                employee_details.personal_email = employee_data.personal_email
            if employee_data.company_email is not None:
                employee_details.company_email = employee_data.company_email
            if employee_data.doj is not None:
                employee_details.doj = employee_data.doj
            if employee_data.dob is not None:
                employee_details.dob = employee_data.dob
            if employee_data.address is not None:
                employee_details.address = employee_data.address
            if employee_data.gender is not None:
                employee_details.gender = employee_data.gender
            if employee_data.graduation_year is not None:
                employee_details.graduation_year = employee_data.graduation_year
            if employee_data.work_experience_years is not None:
                employee_details.work_experience_years = employee_data.work_experience_years
            if employee_data.emergency_contact_name is not None:
                employee_details.emergency_contact_name = employee_data.emergency_contact_name
            if employee_data.emergency_contact_number is not None:
                employee_details.emergency_contact_number = employee_data.emergency_contact_number
            if employee_data.emergency_contact_relation is not None:
                employee_details.emergency_contact_relation = employee_data.emergency_contact_relation
            if employee_data.employment_type is not None:
                employee_details.employment_type = employee_data.employment_type
            
            employee_details.updated_at = datetime.utcnow()
            session.add(employee_details)
        else:
            # Create new details if any detail fields are provided
            if any([
                employee_data.full_name, employee_data.contact_no, employee_data.personal_email,
                employee_data.dob, employee_data.address, employee_data.gender,
                employee_data.graduation_year, employee_data.work_experience_years,
                employee_data.emergency_contact_name, employee_data.emergency_contact_number,
                employee_data.emergency_contact_relation
            ]):
                employee_details = EmployeeDetails(
                    employee_id=employee_id,
                    full_name=employee_data.full_name or employee.name,
                    contact_no=employee_data.contact_no,
                    personal_email=employee_data.personal_email,
                    company_email=employee_data.company_email or employee.company_email,
                    doj=employee_data.doj or employee.doj,
                    dob=employee_data.dob,
                    address=employee_data.address,
                    gender=employee_data.gender,
                    graduation_year=employee_data.graduation_year,
                    work_experience_years=employee_data.work_experience_years or 0,
                    emergency_contact_name=employee_data.emergency_contact_name,
                    emergency_contact_number=employee_data.emergency_contact_number,
                    emergency_contact_relation=employee_data.emergency_contact_relation,
                    employment_type=employee_data.employment_type or employee.employment_type
                )
                session.add(employee_details)
        
        session.commit()
        
        # Get location name if location_id exists
        location_name = None
        if employee.location_id:
            location = session.exec(select(Location).where(Location.id == employee.location_id)).first()
            if location:
                location_name = location.name
        
        # Refresh employee details for response
        if employee_details:
            session.refresh(employee_details)
        
        logger.info(f"Successfully updated employee ID: {employee_id}")
        
        return EmployeeResponse(
            id=employee.id,
            name=employee.name,
            email=employee.email,
            company_email=employee.company_email,
            role=employee.role,
            employment_type=employee.employment_type,
            location_id=employee.location_id,
            location_name=location_name,
            doj=employee.doj,
            o_status=employee.o_status,
            login_status=employee.login_status,
            created_at=employee.created_at.isoformat() if employee.created_at else None,
            full_name=employee_details.full_name if employee_details else None,
            contact_no=employee_details.contact_no if employee_details else None,
            personal_email=employee_details.personal_email if employee_details else None,
            dob=employee_details.dob if employee_details else None,
            address=employee_details.address if employee_details else None,
            gender=employee_details.gender if employee_details else None,
            graduation_year=employee_details.graduation_year if employee_details else None,
            work_experience_years=employee_details.work_experience_years if employee_details else None,
            emergency_contact_name=employee_details.emergency_contact_name if employee_details else None,
            emergency_contact_number=employee_details.emergency_contact_number if employee_details else None,
            emergency_contact_relation=employee_details.emergency_contact_relation if employee_details else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# Delete employee endpoint
@router.delete("/employees/{employee_id}", response_model=EmployeeDeleteResponse)
async def delete_employee(
    employee_id: int,
    session: Session = Depends(get_session)
):
    """
    Delete an employee and all related data
    """
    try:
        # Check if employee exists
        employee = session.exec(select(User).where(User.id == employee_id)).first()
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        # Delete related records first (due to foreign key constraints)
        
        # Delete employee details
        employee_details = session.exec(
            select(EmployeeDetails).where(EmployeeDetails.employee_id == employee_id)
        ).first()
        if employee_details:
            session.delete(employee_details)
        
        # Delete employee master records
        employee_master = session.exec(
            select(EmployeeMaster).where(EmployeeMaster.emp_id == employee_id)
        ).first()
        if employee_master:
            session.delete(employee_master)
        
        # Delete employee HR assignments
        employee_hrs = session.exec(
            select(EmployeeHR).where(EmployeeHR.employee_id == employee_id)
        ).all()
        for hr_assignment in employee_hrs:
            session.delete(hr_assignment)
        
        # Delete employee manager assignments
        employee_managers = session.exec(
            select(EmployeeManager).where(EmployeeManager.employee_id == employee_id)
        ).all()
        for manager_assignment in employee_managers:
            session.delete(manager_assignment)
        
        # Finally delete the employee
        employee_name = employee.name
        session.delete(employee)
        session.commit()
        
        logger.info(f"Successfully deleted employee ID: {employee_id} ({employee_name})")
        
        return EmployeeDeleteResponse(
            status="success",
            message=f"Employee {employee_name} (ID: {employee_id}) has been successfully deleted",
            employee_id=employee_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting employee {employee_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )