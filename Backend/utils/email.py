# app/utils/email.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os
from dotenv import load_dotenv

load_dotenv()

# Email configuration (update with your SMTP settings)
mail_conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your-email@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your-password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "your-email@example.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",  # Update as needed
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False
)

async def send_login_email(email: EmailStr, temp_password: str):
    try:
        reset_url = "http://127.0.0.1:8000/reset-password"  # Update for your frontend
        body = f"""
        Your login credentials are:
        Login ID (Email): {email}
        Temporary Password: {temp_password}

        Change your password here: {reset_url}
        Please log in and change your password.
        """
        message = MessageSchema(
            subject="Your login creds",
            recipients=[email],
            body=body,
            subtype="plain"
        )
        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Login credentials email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send login credentials email: {e}")
        return False

async def send_onboarding_email(email: str, name: str):
    try:
        subject = "Onboarding Completed ✅"
        body = f"""
        Hi {name},

        Congratulations! 🎉  
        Your onboarding process has been successfully completed.  
        You can now access your employee dashboard.

        Regards,  
        HR Team
        """

        message = MessageSchema(
            subject="Your onboarding status",
            recipients=[email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Login credentials email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send login credentials email: {e}")
        return False

async def send_credentials_email(to_email: str, company_email: str, temp_password: str, location: str, doj: str):
    try:
        subject="Your Company Credentials"
        
        body=f"""
        Hello,

        Welcome to the company Nxzen! Here are your credentials:

        Company Email: {company_email}
        Temporary Password: {temp_password}
        Location: {location}
        Date of Joining: {doj}

        Please change your password after first login.

        Regards,
        HR Team
        """ 
        message = MessageSchema(
            subject=subject,
            recipients=[to_email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Login credentials email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send login credentials email: {e}")
        return False

async def forgot_password_mail(email:str,otp:str):
    try:
        subject="Your otp for forgot password",
        
        body=f"""
        Hello,
        you otp :{otp}
        Please change your password after login.

        Regards,
        HR Team
        """ 
        message = MessageSchema(
            subject="Your onboarding status",
            recipients=[email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Login credentials email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send login credentials email: {e}")
        return False
    
async def send_document_request_email(email: str, name: str, document_type: str):
    try:
        subject = "Document Submission Request 📄"

        body = f"""
        Hi {name},

        The HR team has requested you to submit the following document:

        👉 Required Document: {document_type}

        Please upload the document at the earliest through your employee portal.

        Regards,  
        HR Team
        """

        message = MessageSchema(
            subject=subject,
            recipients=[email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Document request email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send document request email: {e}")
        return False
