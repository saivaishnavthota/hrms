from datetime import timedelta, timezone, datetime
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Depends, Request
from sqlmodel import Session, select
from models.user_model import User
from database import get_session
from typing import Annotated, Literal
from functools import wraps
import json

# Optional session store (used for candidate logins)
try:
    from utils.redis_client import redis_client
except Exception:
    redis_client = None

SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Hash plain password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Verify password against hashed
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify JWT token
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
    
def get_current_user(request: Request, db: Session = Depends(get_session)):
    """Resolve current user from Authorization header.

    Supports both:
    - Plain JWTs with `sub` (onboarded employees)
    - Session-based JWTs with `session_id` (candidates)

    Returns a `User` ORM instance for downstream route logic.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing token")

    # Accept both raw token and `Bearer <token>` formats
    token = auth_header.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=403, detail="Invalid or expired token")

    # Candidate/session-based tokens carry `session_id`
    session_id: str | None = payload.get("session_id")
    if session_id:
        # Try Redis first if available
        if redis_client:
            try:
                data = redis_client.get(session_id)
                if data:
                    parsed = json.loads(data)
                    user_id = parsed.get("user_id")
                    user = db.get(User, user_id) if user_id else None
                    if user:
                        return user
            except Exception:
                # Ignore Redis errors and fallback to DB
                pass

        # Fallback to DB sessions table
        result = db.exec(
            """
            SELECT user_id, role, user_type, expires_at, is_active
            FROM sessions WHERE session_id = :sid
            """,
            {"sid": session_id}
        ).first()

        if not result or result.expires_at < datetime.utcnow() or not result.is_active:
            raise HTTPException(status_code=401, detail="Invalid or expired session")

        user = db.get(User, result.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    # Employee tokens carry `sub` (email)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token: missing subject")

    user = db.exec(select(User).where(User.company_email == email)).first()
    if not user:
        # Fallback to personal email if needed
        user = db.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user



#changed
def role_required(role: Literal["HR", "Manager", "Employee","Account Manager"]):
    """
    Returns a dependency that checks if the current user has the required role.
    """
    def dependency(current_user: User = Depends(get_current_user)):
        if current_user.role != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return current_user
    return Depends(dependency)


# # Get current user from token
# async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
#     payload = verify_token(token)
#     if not payload:
#         raise HTTPException(status_code=401, detail="Invalid Token")
#     email = payload.get("sub")
#     if not email:
#         raise HTTPException(status_code=401, detail="Invalid Token: missing sub claim")
#     user = session.exec(select(User).where(User.email == email)).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User Not Found")
#     return user


# # Role-based dependency
# def role_required(*allowed_roles: str):
#     async def dependency(user: User = Depends(get_current_user)):
#         if user.role not in allowed_roles:
#             raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
#         return user
#     return dependency
