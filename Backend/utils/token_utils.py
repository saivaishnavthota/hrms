# app/utils/token_utils.py
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
TOKEN_EXPIRY = 172800  # 48 hours

serializer = URLSafeTimedSerializer(SECRET_KEY)

def generate_token(data: dict) -> str:
    """Generate a time-limited secure token"""
    return serializer.dumps(data)

def verify_token(token: str):
    """Decode token and validate expiry"""
    try:
        return serializer.loads(token, max_age=TOKEN_EXPIRY)
    except SignatureExpired:
        return None  # expired
    except BadSignature:
        return None  # invalid
