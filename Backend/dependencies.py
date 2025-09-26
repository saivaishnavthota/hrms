# dependencies.py
from fastapi import Depends
from sqlmodel import Session
from database import get_session

def get_session_dep() -> Session:
    return Depends(get_session)
