import os
from dotenv import load_dotenv
from datetime import timedelta
load_dotenv()   

class config:
  # Flask-Mail settings
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").lower() in ["true", "1", "yes"]
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "false").lower() in ["true", "1", "yes"]
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")   # your email
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")   # app password or smtp password
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)