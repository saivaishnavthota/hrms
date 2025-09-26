import uuid, datetime, json
from utils.redis_client import redis_client

def create_session(user_id: int, role: str, user_type: str, db_session, ttl_seconds: int = 3600):
    session_id = str(uuid.uuid4())
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(seconds=ttl_seconds)

    # Save in Redis
    redis_client.setex(
        session_id, ttl_seconds,
        json.dumps({"user_id": user_id, "role": role, "user_type": user_type})
    )

    # Save in DB
    from sqlalchemy import text

    db_session.exec(
        text("""INSERT INTO sessions (session_id, user_id, role, user_type, expires_at)
           VALUES (:sid, :uid, :role, :utype, :exp)""").bindparams(
               sid=session_id, uid=user_id, role=role, utype=user_type, exp=expires_at
           )
)
    db_session.commit()


    return session_id, expires_at


def invalidate_session(session_id: str, db_session):
    # Remove from Redis
    redis_client.delete(session_id)

    # Mark inactive in DB
    db_session.exec(
        "UPDATE sessions SET is_active = FALSE WHERE session_id = :sid",
        {"sid": session_id}
    )
    db_session.commit()
