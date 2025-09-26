from datetime import datetime
import uuid

def generate_request_code() -> str:
    # EXP-YYYYMMDD-UUID4(short)
    today = datetime.utcnow().strftime("%Y%m%d")
    unique = uuid.uuid4().hex[:6].upper()
    return f"EXP-{today}-{unique}"
