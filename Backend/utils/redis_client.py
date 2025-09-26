import redis
import os

redis_client = redis.Redis(
    host="redis-13624.c241.us-east-1-4.ec2.redns.redis-cloud.com",  # DNS only
    port=13624,  # numeric port only
    
    password="B2pWocAPdWkJdgD0nOwqEuJsDJLZcm1N",
    decode_responses=True
)

# quick test
try:
    print(redis_client.ping())
except Exception as e:
    print("Redis connection failed:", e)
