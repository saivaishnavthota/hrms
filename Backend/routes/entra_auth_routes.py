from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from typing import Optional
import secrets
import logging
from datetime import timedelta

from models.user_model import User
from database import get_session
from services.entra_service import entra_service
from auth import create_access_token
from schemas.user_schema import UserResponse
from config import config


router = APIRouter(prefix="/auth/entra", tags=["Entra ID Authentication"])
# Additional router for Azure AD standard OAuth2 redirect path
oauth2_router = APIRouter(prefix="/oauth2/redirect", tags=["Entra ID Authentication"])
logger = logging.getLogger(__name__)

# Store state parameters temporarily (use Redis in production)
state_store = {}

@router.get("/login")
async def entra_login():
    """
    Initiate Entra ID authentication flow
    
    Returns authorization URL for frontend to redirect
    """
    try:
        # Check if Entra ID is configured
        if not entra_service.is_configured():
            raise HTTPException(
                status_code=503, 
                detail="Microsoft Entra ID authentication is not configured"
            )
        
        # Generate random state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Get authorization URL
        auth_url = entra_service.get_auth_url(state)
        
        # Store state temporarily (use Redis in production)
        state_store[state] = True
        
        return {
            "auth_url": auth_url,
            "state": state
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating Entra login: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate login")


@router.post("/callback")
async def entra_callback(
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Handle callback from Entra ID with authorization code
    
    Args:
        request: FastAPI Request object containing code and state in body
        session: Database session
        
    Returns:
        JWT token and user information (same structure as traditional login)
    """
    try:
        # Extract code and state from request body
        body = await request.json()
        code = body.get("code")
        state = body.get("state")
        
        if not code or not state:
            raise HTTPException(status_code=400, detail="Missing code or state parameter")
        
        # Validate state parameter
        if state not in state_store:
            logger.warning(f"Invalid state parameter received: {state}")
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        # Remove used state
        del state_store[state]
        
        # Exchange code for tokens
        logger.info(f"Attempting token acquisition for code: {code[:10]}...")
        logger.info(f"Current redirect URI configured: {config.ENTRA_REDIRECT_URI}")
        try:
            token_response = entra_service.acquire_token_by_auth_code(code)
            logger.info("Token acquisition successful")
        except HTTPException as http_exc:
            logger.error(f"Token acquisition failed: {http_exc.detail}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during token acquisition: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Token acquisition failed: {str(e)}")
        
        # Get access token
        access_token = token_response.get("access_token")
        id_token = token_response.get("id_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user profile from Microsoft Graph
        user_profile = entra_service.get_user_profile(access_token)
        
        # Extract user information
        email = user_profile.get("mail") or user_profile.get("userPrincipalName")
        name = user_profile.get("displayName")
        given_name = user_profile.get("givenName")
        surname = user_profile.get("surname")
        job_title = user_profile.get("jobTitle")
        department = user_profile.get("department")
        office_location = user_profile.get("officeLocation")
        entra_id = user_profile.get("id")  # Unique Entra ID identifier
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in user profile")
        
        # Check if user exists in database
        db_user = session.exec(
            select(User).where(User.company_email == email.lower())
        ).first()
        
        if not db_user:
            # Check by personal email as fallback
            db_user = session.exec(
                select(User).where(User.email == email.lower())
            ).first()
        
        if db_user:
            # Update existing user
            db_user.name = name or db_user.name
            db_user.entra_id = entra_id  # Store Entra ID
            db_user.login_status = True
            
            # Update additional fields if available
            if job_title and hasattr(db_user, 'job_title'):
                db_user.job_title = job_title
            if department and hasattr(db_user, 'department'):
                db_user.department = department
                
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            
            logger.info(f"User {email} logged in via Entra ID")
        else:
            # Auto-provision new user
            # Determine role based on business logic
            default_role = determine_user_role(job_title, department)
            
            db_user = User(
                name=name,
                email=email.lower(),
                company_email=email.lower(),
                role=default_role,
                entra_id=entra_id,
                o_status=True,  # Auto-onboarded via Entra ID
                login_status=True,
                password_hash=""  # No password for Entra ID users
            )
            
            # Add optional fields if they exist in model
            if job_title and hasattr(db_user, 'job_title'):
                db_user.job_title = job_title
            if department and hasattr(db_user, 'department'):
                db_user.department = department
            
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
            
            logger.info(f"New user {email} auto-provisioned via Entra ID with role: {default_role}")
        
        # Create internal JWT token (same as traditional login)
        jwt_token = create_access_token(
            data={"sub": db_user.company_email, "role": db_user.role},
            expires_delta=timedelta(minutes=60)
        )
        
        # Return EXACT SAME structure as traditional login
        return UserResponse(
            employeeId=db_user.id,
            name=db_user.name,
            role=db_user.role,
            email=db_user.company_email,
            company_employee_id=db_user.company_employee_id,
            access_token=jwt_token,  # Your internal JWT token
            onboarding_status=db_user.o_status,
            login_status=db_user.login_status,
            type=db_user.role,
            location_id=db_user.location_id,
            super_hr=db_user.super_hr if db_user.role == "HR" else None,
            reassignment=db_user.reassignment if hasattr(db_user, 'reassignment') else None,
            message=f"Welcome, {db_user.name}!"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Entra callback error: {str(e)}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")


@router.get("/user-info")
async def get_entra_user_info(
    access_token: str = Query(..., description="Microsoft access token"),
):
    """
    Get user information from Microsoft Graph (for testing/debugging)
    
    Args:
        access_token: Microsoft access token
        
    Returns:
        User profile data from Microsoft
    """
    try:
        user_profile = entra_service.get_user_profile(access_token)
        return user_profile
    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch user info")


@router.get("/status")
async def entra_status():
    """
    Check if Entra ID is configured and available
    """
    return {
        "configured": entra_service.is_configured(),
        "provider": "Microsoft Entra ID",
        "status": "ready" if entra_service.is_configured() else "not configured"
    }


# Azure AD standard OAuth2 redirect endpoint (alias for /auth/entra/callback)
@oauth2_router.post("/microsoft")
async def microsoft_oauth2_callback(
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Azure AD standard OAuth2 redirect endpoint
    This is an alias for /auth/entra/callback to match Azure AD configuration
    """
    return await entra_callback(request, session)


def determine_user_role(job_title: Optional[str], department: Optional[str]) -> str:
    """
    Determine user role based on job title and department
    
    This is a business logic function that should be customized
    based on your organization's structure
    
    Args:
        job_title: User's job title from Entra ID
        department: User's department from Entra ID
        
    Returns:
        User role (HR, Manager, Employee, etc.)
    """
    if not job_title:
        return "Employee"
    
    job_title_lower = job_title.lower()
    
    # HR roles
    if any(keyword in job_title_lower for keyword in ["hr", "human resources", "people operations", "talent"]):
        return "HR"
    
    # Manager roles
    if any(keyword in job_title_lower for keyword in ["manager", "director", "head", "lead", "supervisor", "chief"]):
        return "Manager"
    
    # Account Manager roles
    if "account manager" in job_title_lower or "client manager" in job_title_lower:
        return "Account Manager"
    
    # IT roles
    if any(keyword in job_title_lower for keyword in ["it support", "it admin", "system admin", "devops", "infrastructure"]):
        return "ITSupporter"
    
    # Check department as fallback
    if department:
        dept_lower = department.lower()
        if "hr" in dept_lower or "human resources" in dept_lower:
            return "HR"
        elif "it" in dept_lower or "information technology" in dept_lower:
            return "ITSupporter"
    
    # Default to Employee
    return "Employee"