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
        body = f"""
╔══════════════════════════════════════════════╗
║                                              ║
║         🔐  YOUR LOGIN CREDENTIALS           ║
║                                              ║
╚══════════════════════════════════════════════╝

Hello,

Your account has been successfully created! Below are your login credentials:

┌─────────────────────────────────────────────┐
│  Login ID (Email): {email}
│  Temporary Password: {temp_password}
└─────────────────────────────────────────────┘

⚠️  IMPORTANT: Please change your password immediately after your first login for security purposes.

Best regards,
Nxzen HR Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
        """
        message = MessageSchema(
            subject="🔑 Your Login Credentials - Nxzen",
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
        body = f"""
╔══════════════════════════════════════════════╗
║                                              ║
║     🎉  ONBOARDING COMPLETE - WELCOME!       ║
║                                              ║
╚══════════════════════════════════════════════╝

Hi {name},

Congratulations! 🎊

Your onboarding process has been successfully completed, and we're thrilled to have you on board!

✓ Profile Setup: Complete
✓ Documentation: Verified
✓ Account Access: Activated

You can now access your employee dashboard and explore all the resources available to you.

We're excited to see the great things you'll accomplish with us!

Warm regards,
Nxzen HR Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
        """

        message = MessageSchema(
            subject="✅ Onboarding Successfully Completed - Welcome to Nxzen!",
            recipients=[email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Onboarding email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send onboarding email: {e}")
        return False

async def send_credentials_email(to_email: str, company_email: str, temp_password: str, location: str, doj: str):
    try:
        body = f"""
╔══════════════════════════════════════════════╗
║                                              ║
║      👋  WELCOME TO NXZEN - YOUR DETAILS     ║
║                                              ║
╚══════════════════════════════════════════════╝

Hello,

Welcome to Nxzen! We're delighted to have you join our team.

Here are your official company credentials and details:

┌─────────────────────────────────────────────┐
│  📧 Company Email:      {company_email}
│  🔐 Temporary Password: {temp_password}
│  📍 Location:           {location}
│  📅 Date of Joining:    {doj}
└─────────────────────────────────────────────┘

⚠️  SECURITY REMINDER:
Please change your password immediately after your first login to ensure account security.

We look forward to working with you!

Best regards,
Nxzen HR Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
        """
        
        message = MessageSchema(
            subject="🌟 Your Company Credentials - Welcome to Nxzen",
            recipients=[to_email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Credentials email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send credentials email: {e}")
        return False

async def forgot_password_mail(email: str, otp: str):
    try:
        body = f"""
╔══════════════════════════════════════════════╗
║                                              ║
║       🔒  PASSWORD RESET REQUEST - OTP       ║
║                                              ║
╚══════════════════════════════════════════════╝

Hello,

We received a request to reset your password. Use the OTP below to proceed:

┌─────────────────────────────────────────────┐
│                                             │
│          Your OTP:  {otp}                   │
│                                             │
└─────────────────────────────────────────────┘


⚠️  If you didn't request this password reset, please ignore this email or contact our support team immediately.

Stay secure,
Nxzen HR Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
        """
        
        message = MessageSchema(
            subject="🔐 Password Reset OTP - Nxzen",
            recipients=[email],
            body=body,
            subtype="plain"
        )

        fm = FastMail(mail_conf)
        await fm.send_message(message)
        print(f"✅ Password reset OTP email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send password reset email: {e}")
        return False
    
async def send_document_request_email(email: str, name: str, document_type: str):
    try:
        body = f"""
╔══════════════════════════════════════════════╗
║                                              ║
║      📄  DOCUMENT SUBMISSION REQUEST         ║
║                                              ║
╚══════════════════════════════════════════════╝

Hi {name},

The HR team requires you to submit an important document for your employee records.

┌─────────────────────────────────────────────┐
│  📋 Required Document: {document_type}
└─────────────────────────────────────────────┘

⚡ ACTION REQUIRED:
Please upload the requested document through your employee portal at your earliest convenience.

If you have any questions or need assistance with the submission process, feel free to reach out to the HR team.

Thank you for your prompt attention to this matter!

Best regards,
Nxzen HR Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is an automated message. Please do not reply to this email.
        """

        message = MessageSchema(
            subject="📎 Document Submission Required - Nxzen HR",
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