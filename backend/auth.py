from datetime import timedelta, timezone, datetime
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, Depends
from sqlmodel import Session, select
from models.user_model import User
from database import get_session
from typing import Annotated

SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Hash plain password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# Verify password against hashed
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Verify JWT token
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def get_current_user(token : Annotated[str, Depends(oauth2_scheme)], session: Session = Depends(get_session)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code = 401, detail = 'Invalid Token')
    user = session.exec(select(User).where(User.email == payload.get('sub'))).first()
    if not user:
        raise HTTPException(status_code=404, detail = 'User Not Found')
    return user