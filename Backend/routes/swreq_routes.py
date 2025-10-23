from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select, delete
from typing import List, Dict, Optional
from models.user_model import User
from models.employee_details_model import Location
from models.employee_assignment_model import EmployeeManager, EmployeeHR
from models.swreq_model import SoftwareRequest, ComplianceQuestion, ComplianceAnswer
from schemas.swreq_schema import (
    SoftwareRequestCreate, SoftwareRequestUpdate, SoftwareRequestResponse, UserResponse,
    ComplianceQuestionCreate, ComplianceQuestionUpdate, ComplianceQuestionResponse,
    ComplianceAnswerCreate, ComplianceAnswerResponse, ComplianceRequest
)
from utils.email import (
    send_new_request_email, send_approval_email_to_employee, send_approval_email_to_it,
    send_rejection_email, send_completion_email, send_compliance_email, send_compliance_answers_email
)
from datetime import datetime
from database import get_session
from sqlalchemy import text
from sqlalchemy.orm import aliased
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/software_requests", tags=["software_requests"])

@router.post("/", response_model=SoftwareRequestResponse)
async def create_software_request(
    request: SoftwareRequestCreate,
    session: Session = Depends(get_session)
):
    # Validate employee
    employee = session.get(User, request.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Validate IT admin
    it_admin = session.get(User, request.it_admin_id)
    if not it_admin or (it_admin.role != "itadmin" and it_admin.role != "Admin"):
        raise HTTPException(status_code=404, detail="IT Admin not found")

    # Validate manager (if provided)
    manager = None
    if request.manager_id:
        manager = session.get(User, request.manager_id)
        if not manager or manager.role != "Manager":
            raise HTTPException(status_code=404, detail="Manager not found")

    # Validate business unit (if provided)
    if request.business_unit_id:
        business_unit = session.get(Location, request.business_unit_id)
        if not business_unit:
            raise HTTPException(status_code=404, detail="Business Unit not found")

    # Validate asset (if provided)
    asset = None
    if request.asset_id:
        from models.asset_model import Asset
        asset = session.get(Asset, request.asset_id)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        # Verify the asset is allocated to the employee
        from models.asset_model import AssetAllocation
        allocation = session.exec(
            select(AssetAllocation).where(
                AssetAllocation.asset_id == request.asset_id,
                AssetAllocation.employee_id == request.employee_id
            )
        ).first()
        if not allocation:
            raise HTTPException(status_code=400, detail="Asset is not allocated to this employee")

    # Create software request directly using SQLModel
    db_request = SoftwareRequest(
        employee_id=request.employee_id,
        manager_id=request.manager_id,
        it_admin_id=request.it_admin_id,
        asset_id=request.asset_id,
        software_name=request.software_name,
        software_version=request.software_version,
        additional_info=request.additional_info,
        business_unit_id=request.business_unit_id,
        software_duration=request.software_duration,
        status="Pending"
    )
    session.add(db_request)
    session.commit()
    session.refresh(db_request)
    
    if not db_request.id:
        raise HTTPException(status_code=500, detail="Failed to create software request")

    request_id = db_request.id
    base_url = "http://127.0.0.1:8000/software_requests"

    approve_url = f"{base_url}/{request_id}/manager-action?action=Approved" if manager else None
    reject_url = f"{base_url}/{request_id}/manager-action?action=Rejected" if manager else None

    business_unit_name = business_unit.name if request.business_unit_id and business_unit else None
    await send_new_request_email(
        manager_name=manager.name if manager else None,
        manager_email=manager.company_email if manager else None,
        it_admin_email=it_admin.company_email,
        employee_name=employee.name,
        employee_email=employee.company_email,
        software_name=request.software_name,
        software_version=request.software_version,
        additional_info=request.additional_info,
        business_unit_name=business_unit_name,  
        software_duration=request.software_duration,  
        approve_url=approve_url,
        reject_url=reject_url
    )

    return session.get(SoftwareRequest, request_id)

@router.get("/{request_id}/manager-action")
async def manager_action(
    request_id: int,
    action: str,
    session: Session = Depends(get_session)
):
    valid_actions = ["Approved", "Rejected"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Fetch the software request
    db_request = session.exec(select(SoftwareRequest).where(SoftwareRequest.id == request_id)).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Software request not found")

    # Fetch manager, employee, and IT admin
    manager = session.exec(select(User).where(User.id == db_request.manager_id)).first()
    employee = session.exec(select(User).where(User.id == db_request.employee_id)).first()
    it_admin = session.exec(select(User).where(User.id == db_request.it_admin_id)).first()

    if not manager:
        raise HTTPException(status_code=404, detail="Manager not assigned")
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if not it_admin:
        raise HTTPException(status_code=404, detail="IT Admin not assigned")

    # Validate email addresses
    if not employee.company_email:
        logger.warning(f"No email address for employee ID {db_request.employee_id}")
    if not it_admin.company_email:
        logger.warning(f"No email address for IT admin ID {db_request.it_admin_id}")

    # Fetch business unit (if provided)
    business_unit = None
    if db_request.business_unit_id:
        business_unit = session.get(Location, db_request.business_unit_id)
        if not business_unit:
            logger.warning(f"Business unit ID {db_request.business_unit_id} not found")
    business_unit_name = business_unit.name if business_unit else None

    # Update request status
    query = text("""
        SELECT update_software_request_status(
            :request_id,
            :status,
            :comments,
            :performed_by_id
        )
    """)
    session.execute(query, {
        "request_id": request_id,
        "status": action,
        "comments": f"Action performed by manager",
        "performed_by_id": manager.id
    })
    session.commit()

    # Send emails based on action
    if action == "Approved":
        await send_approval_email_to_employee(employee, manager, db_request, business_unit_name)
        await send_approval_email_to_it(it_admin, employee, manager, db_request, business_unit_name)
    elif action == "Rejected":
        await send_rejection_email(employee, it_admin, manager, db_request, business_unit_name, comments="Rejected by manager")

    return {"message": f"Software request {action} successfully"}

@router.get("/{request_id}/complete")
async def complete_software_request(
    request_id: int,
    session: Session = Depends(get_session)
):
    try:
        # Fetch the software request
        db_request = session.exec(select(SoftwareRequest).where(SoftwareRequest.id == request_id)).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Software request not found")

        # Fetch IT admin and employee
        it_admin = session.exec(select(User).where(User.id == db_request.it_admin_id)).first()
        employee = session.exec(select(User).where(User.id == db_request.employee_id)).first()

        if not it_admin:
            raise HTTPException(status_code=404, detail="IT Admin not assigned")
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Update request status via stored procedure
        query = text("""
            SELECT update_software_request_status(
                :request_id,
                :status,
                :comments,
                :performed_by_id
            )
        """)
        session.execute(query, {
            "request_id": request_id,
            "status": "Completed",
            "comments": "Marked as completed by IT Admin",
            "performed_by_id": it_admin.id
        })

        # Retrieve business_unit_name and software_duration
        business_unit = None
        if db_request.business_unit_id:
            business_unit = session.get(Location, db_request.business_unit_id)
            if not business_unit:
                logger.warning(f"Business unit ID {db_request.business_unit_id} not found")
        business_unit_name = business_unit.name if business_unit else None
        software_duration = getattr(db_request, 'software_duration', None)

        # Send completion email
        success = await send_completion_email(
            recipient=employee.company_email,
            software_name=db_request.software_name,
            employee_name=employee.name,
            business_unit_name=business_unit_name,
            software_duration=software_duration
        )

        if not success:
            logger.warning(f"Failed to send completion email for request {request_id}")

        # Log in audit_trails
        session.execute(
            text("""
                INSERT INTO audit_trails (request_id, action, performed_by_id, details)
                VALUES (:request_id, 'RequestCompleted', :it_admin_id, :details)
            """),
            {
                "request_id": request_id,
                "it_admin_id": it_admin.id,
                "details": f"Software request for {db_request.software_name} completed"
            }
        )

        session.commit()
        return {"message": f"Software request {request_id} completed successfully"}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error completing request {request_id}: {str(e)}")
        session.rollback()
        if "Compliance answers not submitted" in str(e):
            raise HTTPException(status_code=400, detail="Cannot complete request: Compliance answers not submitted")
        raise HTTPException(status_code=500, detail=f"Failed to complete request: {str(e)}")

@router.get("/", response_model=List[SoftwareRequestResponse])
async def list_software_requests(
    status: Optional[str] = Query(None, description="Filter by request status"),
    session: Session = Depends(get_session)
):
    EmployeeUser = aliased(User, name="employee_user")
    ManagerUser = aliased(User, name="manager_user")
    ItAdminUser = aliased(User, name="it_admin_user")
    LocationAlias = aliased(Location, name="location")  # Alias for locations table

    # Add asset information
    from models.asset_model import Asset
    AssetAlias = aliased(Asset, name="asset")
    
    query = (
        select(
            SoftwareRequest.id,
            SoftwareRequest.employee_id,
            SoftwareRequest.manager_id,
            SoftwareRequest.it_admin_id,
            SoftwareRequest.asset_id,  # New field
            SoftwareRequest.software_name,
            SoftwareRequest.software_version,
            SoftwareRequest.status,
            SoftwareRequest.created_at,
            SoftwareRequest.updated_at,
            SoftwareRequest.comments,
            SoftwareRequest.additional_info,
            SoftwareRequest.compliance_answered,
            SoftwareRequest.business_unit_id,  # New field
            SoftwareRequest.software_duration,  # New field
            EmployeeUser.name.label("employee_name"),
            EmployeeUser.company_email.label("employee_email"),
            ManagerUser.name.label("manager_name"),
            ManagerUser.company_email.label("manager_email"),
            ItAdminUser.name.label("it_admin_name"),
            ItAdminUser.company_email.label("it_admin_email"),
            LocationAlias.name.label("business_unit_name"),  # New field
            AssetAlias.asset_name.label("asset_name"),  # New field
            AssetAlias.asset_tag.label("asset_tag"),  # New field
            AssetAlias.asset_type.label("asset_type")  # New field
        )
        .join(EmployeeUser, EmployeeUser.id == SoftwareRequest.employee_id, isouter=False)
        .outerjoin(ManagerUser, ManagerUser.id == SoftwareRequest.manager_id)
        .outerjoin(ItAdminUser, ItAdminUser.id == SoftwareRequest.it_admin_id)
        .outerjoin(LocationAlias, LocationAlias.id == SoftwareRequest.business_unit_id)  # Join with locations
        .outerjoin(AssetAlias, AssetAlias.asset_id == SoftwareRequest.asset_id)  # Join with assets
    )

    if status:
        query = query.where(SoftwareRequest.status == status)

    results = session.exec(query).all()

    response = []
    for result in results:
        answers_query = (
            select(
                ComplianceAnswer.id,
                ComplianceAnswer.question_id,
                ComplianceAnswer.answer,
                ComplianceAnswer.created_at,
                ComplianceQuestion.question_text
            )
            .join(ComplianceQuestion, ComplianceQuestion.id == ComplianceAnswer.question_id)
            .where(ComplianceAnswer.request_id == result.id)
        )
        answers = session.exec(answers_query).all()
        answers_list = [
            ComplianceAnswerResponse(
                id=ans.id,
                question_id=ans.question_id,
                answer=ans.answer,
                question_text=ans.question_text,
                created_at=ans.created_at
            ) for ans in answers
        ]

        response.append({
            "id": result.id,
            "employee_id": result.employee_id,
            "employee_name": result.employee_name,
            "employee_email": result.employee_email,
            "manager_id": result.manager_id,
            "manager_name": result.manager_name,
            "manager_email": result.manager_email,
            "it_admin_id": result.it_admin_id,
            "it_admin_name": result.it_admin_name,
            "it_admin_email": result.it_admin_email,
            "asset_id": result.asset_id,  # New field
            "asset_name": result.asset_name,  # New field
            "asset_tag": result.asset_tag,  # New field
            "asset_type": result.asset_type,  # New field
            "software_name": result.software_name,
            "software_version": result.software_version,
            "additional_info": result.additional_info,
            "status": result.status,
            "created_at": result.created_at.isoformat(),
            "updated_at": result.updated_at.isoformat() if result.updated_at else None,
            "comments": result.comments,
            "compliance_answered": result.compliance_answered,
            "business_unit_id": result.business_unit_id,  # New field
            "business_unit_name": result.business_unit_name,  # New field
            "software_duration": result.software_duration,  # New field
            "compliance_answers": answers_list
        })

    return response
@router.get("/employees/{employee_id}/managers", response_model=List[UserResponse])
async def get_employee_managers(employee_id: int, session: Session = Depends(get_session)):
    try:
        # Check if employee exists
        employee = session.exec(select(User).where(User.id == employee_id)).first()
        if not employee:
            print(f"Employee {employee_id} not found")
            return []
        
        managers = []
        
        try:
            print(f"Fetching managers for employee {employee_id} from EmployeeManager table")
            
            # Query to get managers for the employee
            manager_records = session.exec(
                select(EmployeeManager).where(EmployeeManager.employee_id == employee_id)
            ).all()
            
            print(f"Found {len(manager_records)} manager relationships")
            
            # Get the actual manager User objects
            for record in manager_records:
                manager = session.exec(
                    select(User).where(User.id == record.manager_id)
                ).first()
                
                if manager:
                    print(f"Found manager: {manager.name} (ID: {manager.id})")
                    managers.append(manager)
                else:
                    print(f"Manager ID {record.manager_id} not found in User table")
                    
        except Exception as e:
            print(f"Error fetching from EmployeeManager table: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # If no managers found, try fallback
        if not managers:
            print(f"No managers found for employee {employee_id}, trying fallback")
            try:
                fallback_managers = session.exec(
                    select(User).where(User.role == "Manager")
                ).all()
                print(f"Found {len(fallback_managers)} users with Manager role")
                managers.extend(fallback_managers)
            except Exception as e:
                print(f"Fallback query failed: {str(e)}")
        
        print(f"Returning {len(managers)} managers for employee {employee_id}")
        # Return User objects directly, not dictionaries
        return managers
        
    except Exception as e:
        print(f"Error fetching managers for employee {employee_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
        
@router.get("/it_admins/", response_model=List[UserResponse])
async def get_it_admins(session: Session = Depends(get_session)):
    it_admins = session.exec(select(User).where((User.role =="itadmin") | (User.role == "Admin"))).all()
    return [{"id": a.id, "name": a.name, "email": a.company_email} for a in it_admins]

# Debug endpoint to test database connectivity
@router.get("/debug/employee/{employee_id}")
async def debug_employee_managers(employee_id: int, session: Session = Depends(get_session)):
    try:
        # Test basic employee lookup
        employee = session.exec(select(User).where(User.id == employee_id)).first()
        if not employee:
            return {"error": f"Employee {employee_id} not found"}
        
        # Test EmployeeManager table with join
        try:
            # Test the join query
            manager_query = session.exec(
                select(User)
                .join(EmployeeManager, EmployeeManager.manager_id == User.id)
                .where(EmployeeManager.employee_id == employee_id)
            ).all()
            
            # Also get raw records for debugging
            manager_records = session.exec(select(EmployeeManager).where(EmployeeManager.employee_id == employee_id)).all()
            
            return {
                "employee_id": employee_id,
                "employee_name": employee.name,
                "manager_records_count": len(manager_records),
                "manager_records": [{"id": m.id, "employee_id": m.employee_id, "manager_id": m.manager_id} for m in manager_records],
                "managers_via_join": [{"id": m.id, "name": m.name, "email": m.company_email} for m in manager_query],
                "join_query_success": True,
                "status": "success"
            }
        except Exception as e:
            return {
                "employee_id": employee_id,
                "employee_name": employee.name,
                "error": f"EmployeeManager join query failed: {str(e)}",
                "join_query_success": False,
                "status": "error"
            }
    except Exception as e:
        return {"error": f"General error: {str(e)}", "status": "error"}

@router.get("/locations/", response_model=List[dict])  # New endpoint for locations
async def get_locations(session: Session = Depends(get_session)):
    locations = session.exec(select(Location)).all()
    return [{"id": loc.id, "name": loc.name} for loc in locations]

@router.get("/employees/{employee_id}/assets", response_model=List[dict])
async def get_employee_assets_for_selection(employee_id: int, session: Session = Depends(get_session)):
    """
    Get all assets allocated to a specific employee for software request selection
    """
    from models.asset_model import Asset, AssetAllocation
    
    # Get allocations for the employee
    allocations = session.exec(
        select(AssetAllocation).where(AssetAllocation.employee_id == employee_id)
    ).all()
    
    employee_assets = []
    for allocation in allocations:
        # Get asset details
        asset = session.get(Asset, allocation.asset_id)
        if asset and asset.status == "Allocated":  # Only show allocated assets
            employee_assets.append({
                "asset_id": asset.asset_id,
                "asset_name": asset.asset_name,
                "asset_tag": asset.asset_tag,
                "asset_type": asset.asset_type,
                "brand": asset.brand,
                "model": asset.model,
                "serial_number": asset.serial_number,
                "condition": asset.condition,
                "allocation_date": allocation.allocation_date.isoformat() if allocation.allocation_date else None
            })
    
    return employee_assets

@router.get("/compliance_questions/", response_model=List[ComplianceQuestionResponse])
async def list_compliance_questions(session: Session = Depends(get_session)):
    results = session.exec(
        select(ComplianceQuestion).where(ComplianceQuestion.is_active == True)
    ).all()
    return results

@router.post("/compliance_questions/", response_model=ComplianceQuestionResponse)
async def create_compliance_question(
    question: ComplianceQuestionCreate,
    session: Session = Depends(get_session)
):
    db_question = ComplianceQuestion(**question.dict())
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question

@router.put("/compliance_questions/{question_id}", response_model=ComplianceQuestionResponse)
async def update_compliance_question(
    question_id: int,
    update_data: ComplianceQuestionUpdate,
    session: Session = Depends(get_session)
):
    db_question = session.get(ComplianceQuestion, question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    update_dict = update_data.dict(exclude_unset=True)

    if update_dict:
        db_question.updated_at = datetime.now()
    for key, value in update_dict.items():
        setattr(db_question, key, value)
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question

@router.delete("/compliance_questions/{question_id}")
async def delete_compliance_question(
    question_id: int,
    session: Session = Depends(get_session)
):
    db_question = session.get(ComplianceQuestion, question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    if not db_question.is_active:
        raise HTTPException(status_code=400, detail="Question already deleted")
    
    db_question.is_active = False
    db_question.deleted_at = datetime.now()
    db_question.updated_at = datetime.now()  
    session.add(db_question)
    session.commit()
    return {"message": "Question soft-deleted successfully"}

@router.get("/{request_id}/compliance_questions", response_model=List[ComplianceQuestionResponse])
async def get_compliance_questions_for_request(
    request_id: int,
    session: Session = Depends(get_session)
):
    db_request = session.get(SoftwareRequest, request_id)
    if not db_request:
        raise HTTPException(status_code=404, detail="Software request not found")
    
    results = session.exec(
        select(ComplianceQuestion).where(ComplianceQuestion.is_active == True)
    ).all()
    return results

@router.post("/{request_id}/compliance_answers")
async def submit_compliance_answers(
    request_id: int,
    answers: List[ComplianceAnswerCreate],
    session: Session = Depends(get_session)
):
    logger.info(f"Processing compliance answers for request_id: {request_id}")
    
    # Verify the software request exists
    db_request = session.get(SoftwareRequest, request_id)
    if not db_request:
        logger.error(f"Software request {request_id} not found")
        raise HTTPException(status_code=404, detail="Software request not found")

    logger.info(f"Found software request: {db_request.software_name}, version: {db_request.software_version}")

    # Get business unit
    business_unit = None
    if db_request.business_unit_id:
        business_unit = session.get(Location, db_request.business_unit_id)
        if not business_unit:
            logger.warning(f"Business unit ID {db_request.business_unit_id} not found")
    business_unit_name = business_unit.name if business_unit else None

    # Prepare answers for stored procedure
    answers_json = [{"question_id": ans.question_id, "answer": ans.answer} for ans in answers]
    serialized_answers = json.dumps(answers_json)
    logger.info(f"Serialized answers: {serialized_answers}")

    # Call stored procedure
    try:
        result = session.execute(
            text("""
                SELECT submit_compliance_answers(
                    :request_id,
                    CAST(:answers AS JSONB),
                    :employee_id
                )
            """),
            {
                "request_id": request_id,
                "answers": serialized_answers,
                "employee_id": db_request.employee_id
            }
        )
        session.commit()
        logger.info(f"Stored procedure executed successfully for request_id: {request_id}")
    except Exception as e:
        session.rollback()
        logger.error(f"Failed to execute stored procedure: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to submit answers: {str(e)}")

    # Fetch users for notification
    it_admin = session.get(User, db_request.it_admin_id)
    manager = session.get(User, db_request.manager_id)
    employee = session.get(User, db_request.employee_id)

    logger.info(f"IT Admin: {it_admin.company_email if it_admin else 'None'}, "
                f"Manager: {manager.company_email if manager else 'None'}, "
                f"Employee: {employee.name if employee else 'None'}")

    # Send notification email
    email_sent = await send_compliance_answers_email(
        it_admin_email=it_admin.company_email if it_admin else None,
        manager_email=manager.company_email if manager else None,
        employee_name=employee.name if employee else "Unknown",
        software_name=db_request.software_name,
        request_id=request_id,
        business_unit_name=business_unit_name,
        session=session
    )
    logger.info(f"Email sending result: {email_sent}")

    return {"message": "Compliance answers submitted successfully"}

@router.get("/{request_id}/compliance_answers", response_model=List[ComplianceAnswerResponse])
async def get_compliance_answers(
    request_id: int,
    session: Session = Depends(get_session)
):
    db_request = session.get(SoftwareRequest, request_id)
    if not db_request:
        raise HTTPException(status_code=404, detail="Software request not found")

    query = (
        select(
            ComplianceAnswer.id,
            ComplianceAnswer.question_id,
            ComplianceAnswer.answer,
            ComplianceAnswer.created_at,
            ComplianceQuestion.question_text
        )
        .join(ComplianceQuestion, ComplianceQuestion.id == ComplianceAnswer.question_id)
        .where(ComplianceAnswer.request_id == request_id)
    )

    results = session.exec(query).all()

    return [
        ComplianceAnswerResponse(
            id=ans.id,
            question_id=ans.question_id,
            answer=ans.answer,
            question_text=ans.question_text,
            created_at=ans.created_at
        )
        for ans in results
    ]

@router.post("/send_compliance")
async def send_compliance_emails(
    data: ComplianceRequest,
    session: Session = Depends(get_session)
):
    if not data.request_ids:
        raise HTTPException(status_code=400, detail="No request IDs provided")

    # Fetch only active compliance questions
    questions = session.exec(
        select(ComplianceQuestion).where(ComplianceQuestion.is_active == True)
    ).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No active compliance questions defined")

    failed_requests = []
    for req_id in data.request_ids:
        try:
            db_request = session.get(SoftwareRequest, req_id)
            if not db_request:
                logger.warning(f"SoftwareRequest not found for ID {req_id}")
                failed_requests.append(req_id)
                continue

            employee = session.get(User, db_request.employee_id)
            if not employee:
                logger.warning(f"Employee not found for ID {db_request.employee_id}")
                failed_requests.append(req_id)
                continue

            # Fetch business_unit_name from Location if not stored in SoftwareRequest
            business_unit_name = getattr(db_request, 'business_unit_name', None)
            if not business_unit_name and db_request.business_unit_id:
                business_unit = session.get(Location, db_request.business_unit_id)
                business_unit_name = business_unit.name if business_unit else None
                if not business_unit:
                    logger.warning(f"Business unit ID {db_request.business_unit_id} not found")

            software_duration = getattr(db_request, 'software_duration', None)

            # Send compliance email with only active questions
            success = await send_compliance_email(
                employee_email=employee.company_email,
                employee_name=employee.name,
                software_name=db_request.software_name,
                business_unit_name=business_unit_name,
                software_duration=software_duration,
                questions=[q.question_text for q in questions]
            )

            if not success:
                logger.warning(f"Failed to send compliance email for request {req_id}")
                failed_requests.append(req_id)
                continue

            # Update compliance_sent
            db_request.compliance_sent = True
            session.add(db_request)

            # Log in audit_trails
            session.execute(
                text("""
                    INSERT INTO audit_trails (request_id, action, performed_by_id, details)
                    VALUES (:request_id, 'ComplianceSent', :it_admin_id, :details)
                """),
                {
                    "request_id": req_id,
                    "it_admin_id": db_request.it_admin_id,
                    "details": f"Compliance email sent for {db_request.software_name}"
                }
            )
        except Exception as e:
            logger.error(f"Error processing request {req_id}: {str(e)}")
            failed_requests.append(req_id)
            continue

    session.commit()

    if failed_requests:
        return {
            "message": "Compliance emails processed with some failures",
            "failed_request_ids": failed_requests
        }
    return {"message": "Compliance emails sent successfully"}