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
    
    # Microsoft Entra ID Configuration
    ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID")
    ENTRA_CLIENT_SECRET = os.getenv("ENTRA_CLIENT_SECRET")
    ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID")
    ENTRA_AUTHORITY = f"https://login.microsoftonline.com/{os.getenv('ENTRA_TENANT_ID', 'common')}"
    ENTRA_REDIRECT_URI = os.getenv("ENTRA_REDIRECT_URI", "http://localhost:5173/auth/callback")
    ENTRA_SCOPES = ["User.Read", "openid", "profile", "email"]
    
    # Microsoft Graph API
    GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"