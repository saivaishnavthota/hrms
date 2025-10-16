from pydantic import EmailStr
import os
import base64
from pathlib import Path
from typing import Optional, List
from dotenv import load_dotenv
from email.message import EmailMessage
import aiosmtplib
from models.user_model import User
from models.swreq_model import SoftwareRequest, ComplianceAnswer, ComplianceQuestion
from sqlmodel import Session, select
import logging
from database import get_session
from fastapi import Depends

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Email configuration (update with your SMTP settings)
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "your-email@example.com")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "your-password")
MAIL_FROM = os.getenv("MAIL_FROM", MAIL_USERNAME)
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "true").lower() in {"1", "true", "yes"}
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "false").lower() in {"1", "true", "yes"}
USE_CREDENTIALS = os.getenv("USE_CREDENTIALS", "true").lower() in {"1", "true", "yes"}
VALIDATE_CERTS = os.getenv("VALIDATE_CERTS", "true").lower() in {"1", "true", "yes"}


async def send_email(subject: str, recipients: list[str], html_body: str) -> bool:
    """Send an HTML email using SMTP via aiosmtplib.

    This replaces fastapi-mail to avoid Pydantic v2 compatibility issues.
    """
    try:
        if not recipients:
            return False

        message = EmailMessage()
        message["From"] = MAIL_FROM
        message["To"] = ", ".join(recipients)
        message["Subject"] = subject
        # Provide a plain-text fallback for better deliverability
        message.set_content("This email requires an HTML-capable client.")
        message.add_alternative(html_body, subtype="html")

        # Choose connection mode
        if MAIL_SSL_TLS and not MAIL_STARTTLS:
            # Implicit TLS (e.g., port 465)
            smtp = aiosmtplib.SMTP(hostname=MAIL_SERVER, port=MAIL_PORT, use_tls=True, validate_certs=VALIDATE_CERTS)
        else:
            # Plain or STARTTLS (e.g., port 587)
            smtp = aiosmtplib.SMTP(hostname=MAIL_SERVER, port=MAIL_PORT, start_tls=MAIL_STARTTLS, validate_certs=VALIDATE_CERTS)

        await smtp.connect()
        if USE_CREDENTIALS and MAIL_USERNAME and MAIL_PASSWORD:
            await smtp.login(MAIL_USERNAME, MAIL_PASSWORD)
        await smtp.send_message(message)
        await smtp.quit()
        return True
    except Exception as exc:
        logger.error(f"❌ SMTP send failed: {exc}")
        return False


# Convert logo to base64
def get_logo_base64():
    """Convert Nxzen logo to base64 string for email embedding"""
    try:
        logo_path = Path(__file__).parent.parent.parent / "Frontend" / "public" / "media" / "images" / "Nxzen logo.jpg"
        with open(logo_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode()
            return f"data:image/jpeg;base64,{encoded_string}"
    except Exception as e:
        logger.error(f"❌ Failed to load logo: {e}")
        return ""

LOGO_BASE64 = get_logo_base64()

# HTML Email Template Base
def get_email_template(title: str, content: str) -> str:
    """Generate professional HTML email template with Nxzen branding"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f7fa;
                padding: 20px;
                line-height: 1.6;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .email-header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px; 
                text-align: center;
            }}

            .logo {{
                max-width: 180px;
                height: auto;
                margin-bottom: 20px;
                background-color: #000;
                padding: 15px;
                border-radius: 8px;
            }}
            .email-title {{
                color: #ffffff;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }}
            .email-content {{
                padding: 40px 30px;
                color: #333333;
            }}
            .greeting {{
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #2c3e50;
            }}
            .info-box {{
                background-color: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 25px 0;
                border-radius: 4px;
            }}
            .info-item {{
                padding: 8px 0;
                font-size: 15px;
            }}
            .info-label {{
                font-weight: 600;
                color: #555;
                display: inline-block;
                min-width: 180px;
            }}
            .info-value {{
                color: #333;
                font-weight: 500;
            }}
            .warning-box {{
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .warning-text {{
                color: #856404;
                font-size: 14px;
                margin: 0;
            }}
            .success-box {{
                background-color: #d4edda;
                border-left: 4px solid #28a745;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .success-text {{
                color: #155724;
                font-size: 14px;
                margin: 0;
            }}
            .button {{
                display: inline-flex;
                justify-content: center;
                align-items: center;
                min-width: 120px;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 10px 5px;
                text-align: center;
            }}
            .reject-button {{
                background: linear-gradient(135deg, #ff4b4b 0%, #d32f2f 100%);
            }}
            .email-footer {{
                background-color: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
                border-top: 1px solid #e9ecef;
            }}
            .footer-text {{
                margin: 5px 0;
            }}
            .divider {{
                height: 1px;
                background-color: #e9ecef;
                margin: 20px 0;
            }}
            ul {{
                list-style: none;
                padding: 0;
            }}
            li {{
                padding: 8px 0;
                font-size: 15px;
            }}
            li:before {{
                content: "✓ ";
                color: #28a745;
                font-weight: bold;
                margin-right: 8px;
            }}
            @media only screen and (max-width: 768px) {{
                .button {{
                    width: 100% !important;
                    box-sizing: border-box;
                }}
            }}

        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                {f'<img src="{LOGO_BASE64}" alt="Nxzen Logo" class="logo">' if LOGO_BASE64 else ''}
                <h1 class="email-title">{title}</h1>
            </div>
            <div class="email-content">
                {content}
            </div>
            <div class="email-footer">
                <p class="footer-text"><strong>Nxzen HR Team</strong></p>
                <p class="footer-text">This is an automated message. Please do not reply to this email.</p>
                <p class="footer-text" style="margin-top: 15px; color: #999; font-size: 12px;">
                    © 2025 Nxzen. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

async def send_login_email(email: EmailStr, temp_password: str):
    try:
        content = f"""
            <p class="greeting">Hello,</p>
            <p>Your account has been successfully created! Below are your login credentials:</p>
            
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">📧 Login ID (Email):</span>
                    <span class="info-value">{email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🔐 Temporary Password:</span>
                    <span class="info-value"><strong>{temp_password}</strong></span>
                </div>
            </div>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ IMPORTANT:</strong> Please change your password immediately after your first login for security purposes.
                </p>
            </div>
            
            <p style="margin-top: 25px;">We're excited to have you on board!</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """
        
        html_body = get_email_template("🔐 Your Login Credentials", content)
        
        await send_email(
            subject="🔑 Your Login Credentials - Nxzen",
            recipients=[str(email)],
            html_body=html_body,
        )
        logger.info(f"✅ Login credentials email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send login credentials email: {e}")
        return False

async def send_onboarding_email(email: str, name: str):
    try:
        content = f"""
            <p class="greeting">Hi {name},</p>
            <p style="font-size: 18px; margin: 20px 0;">Congratulations! 🎊</p>
            <p>Your onboarding process has been successfully completed, and we're thrilled to have you on board!</p>
            
            <div class="success-box">
                <ul style="margin: 0;">
                    <li>Profile Setup: Complete</li>
                    <li>Documentation: Verified</li>
                    <li>Account Access: Activated</li>
                </ul>
            </div>
            
            <p>You can now access your employee dashboard and explore all the resources available to you.</p>
            <p style="margin-top: 25px;">We're excited to see the great things you'll accomplish with us!</p>
            
            <p style="margin-top: 30px;">Warm regards,<br><strong>Nxzen HR Team</strong></p>
        """

        html_body = get_email_template("🎉 Onboarding Complete - Welcome!", content)

        await send_email(
            subject="✅ Onboarding Successfully Completed - Welcome to Nxzen!",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Onboarding email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send onboarding email: {e}")
        return False

async def send_credentials_email(to_email: str, company_email: str, temp_password: str, location: str, doj: str):
    try:
        content = f"""
            <p class="greeting">Hello,</p>
            <p>Welcome to Nxzen! We're delighted to have you join our team. 👋</p>
            <p>Here are your official company credentials and details:</p>
            
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">📧 Company Email:</span>
                    <span class="info-value">{company_email}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🔐 Temporary Password:</span>
                    <span class="info-value"><strong>{temp_password}</strong></span>
                </div>
                <div class="info-item">
                    <span class="info-label">📍 Location:</span>
                    <span class="info-value">{location}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📅 Date of Joining:</span>
                    <span class="info-value">{doj}</span>
                </div>
            </div>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ SECURITY REMINDER:</strong> Please change your password immediately after your first login to ensure account security.
                </p>
            </div>
            
            <p style="margin-top: 25px;">We look forward to working with you!</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """
        
        html_body = get_email_template("👋 Welcome to Nxzen - Your Details", content)
        
        await send_email(
            subject="🌟 Your Company Credentials - Welcome to Nxzen",
            recipients=[to_email],
            html_body=html_body,
        )
        logger.info(f"✅ Credentials email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send credentials email: {e}")
        return False

async def forgot_password_mail(email: str, otp: str):
    try:
        content = f"""
            <p class="greeting">Hello,</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            
            <div class="info-box" style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px;">
                <p style="color: white; font-size: 14px; margin-bottom: 10px;">YOUR OTP CODE</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; color: white;">{otp}</p>
            </div>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ SECURITY NOTICE:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.
                </p>
            </div>
            
            <p style="margin-top: 25px;">This OTP will expire in 10 minutes for security reasons.</p>
            <p>Stay secure,<br><strong>Nxzen HR Team</strong></p>
        """
        
        html_body = get_email_template("🔒 Password Reset Request - OTP", content)
        
        await send_email(
            subject="🔐 Password Reset OTP - Nxzen",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Password reset OTP email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send password reset email: {e}")
        return False
    
async def send_document_request_email(email: str, name: str, document_type: str):
    try:
        content = f"""
            <p class="greeting">Hi {name},</p>
            <p>The HR team requires you to submit an important document for your employee records.</p>
            
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">📋 Required Document:</span>
                    <span class="info-value"><strong>{document_type}</strong></span>
                </div>
            </div>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚡ ACTION REQUIRED:</strong> Please upload the requested document through your employee portal at your earliest convenience.
                </p>
            </div>
            
            <p>If you have any questions or need assistance with the submission process, feel free to reach out to the HR team.</p>
            <p style="margin-top: 25px;">Thank you for your prompt attention to this matter!</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """

        html_body = get_email_template("📄 Document Submission Request", content)

        await send_email(
            subject="📎 Document Submission Required - Nxzen HR",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Document request email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send document request email: {e}")
        return False

# ===========================
# LEAVE MANAGEMENT EMAILS
# ===========================

async def send_manager_leave_notification(email: str, employee_name: str, employee_email: str, leave_type: str, start_date: str, end_date: str, no_of_days: int, reason: str, approve_url: str, reject_url: str):
    try:
        content = f"""
            <p class="greeting">Dear Manager,</p>
            <p>{employee_name} ({employee_email}) has submitted a leave request. Please review the details below:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Leave Type:</span>
                    <span class="info-value">{leave_type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Start Date:</span>
                    <span class="info-value">{start_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">{end_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Number of Days:</span>
                    <span class="info-value">{no_of_days}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Reason:</span>
                    <span class="info-value">{reason or 'Not provided'}</span>
                </div>
            </div>
            <p>Please take action on this request:</p>
            <div>
                <a href="{approve_url}" class="button">Approve</a>
                <a href="{reject_url}" class="button reject-button">Reject</a>
            </div>
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ Note:</strong> This action is required to proceed with the leave approval process.
                </p>
            </div>
            <p style="margin-top: 25px;">Thank you for your attention.</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """
        html_body = get_email_template("📋 Leave Request Notification", content)
        await send_email(
            subject="📅 New Leave Request - Action Required",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Manager leave notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send manager leave notification: {e}")
        return False

async def send_hr_leave_notification(email: str, employee_name: str, employee_email: str, leave_type: str, start_date: str, end_date: str, no_of_days: int, reason: str, approve_url: str, reject_url: str):
    try:
        content = f"""
            <p class="greeting">Dear HR,</p>
            <p>A leave request from {employee_name} ({employee_email}) has been approved by their manager. Please review the details below:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Leave Type:</span>
                    <span class="info-value">{leave_type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Start Date:</span>
                    <span class="info-value">{start_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">{end_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Number of Days:</span>
                    <span class="info-value">{no_of_days}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Reason:</span>
                    <span class="info-value">{reason or 'Not provided'}</span>
                </div>
            </div>
            <p>Please take action on this request:</p>
            <div>
                <a href="{approve_url}" class="button">Approve</a>
                <a href="{reject_url}" class="button reject-button">Reject</a>
            </div>
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ Note:</strong> Your action will finalize the leave request status.
                </p>
            </div>
            <p style="margin-top: 25px;">Thank you for your attention.</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """
        html_body = get_email_template("📋 Leave Request for Final Approval", content)
        await send_email(
            subject="📅 Leave Request - HR Approval Required",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ HR leave notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send HR leave notification: {e}")
        return False

async def send_employee_leave_status(email: str, leave_type: str, start_date: str, end_date: str, no_of_days: int, reason: str, status: str):
    try:
        status_text = "approved" if status == "Approved" else "rejected"
        status_class = "success-box" if status == "Approved" else "warning-box"
        status_color = "#28a745" if status == "Approved" else "#ffc107"
        content = f"""
            <p class="greeting">Hello,</p>
            <p>Your leave request has been processed. Below are the details:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Leave Type:</span>
                    <span class="info-value">{leave_type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Start Date:</span>
                    <span class="info-value">{start_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">End Date:</span>
                    <span class="info-value">{end_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Number of Days:</span>
                    <span class="info-value">{no_of_days}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Reason:</span>
                    <span class="info-value">{reason or 'Not provided'}</span>
                </div>
            </div>
            <div class="{status_class}">
                <p class="{status_class}-text" style="color: {status_color};">
                    <strong>Status:</strong> Your leave request has been {status_text}.
                </p>
            </div>
            <p style="margin-top: 25px;">If you have any questions, please contact the HR team.</p>
            <p>Best regards,<br><strong>Nxzen HR Team</strong></p>
        """
        html_body = get_email_template(f"📅 Leave Request Status - {status}", content)
        await send_email(
            subject=f"📅 Your Leave Request has been {status} - Nxzen",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Employee leave status email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send employee leave status email: {e}")
        return False

# ===========================
# EXPENSE MANAGEMENT EMAILS
# ===========================

async def send_manager_expense_notification(
    email: str, 
    employee_name: str, 
    employee_email: str, 
    request_code: str, 
    category: str, 
    amount: float, 
    currency: str, 
    description: str, 
    expense_date: str,
    approve_url: str, 
    reject_url: str
):
    """Send expense notification to manager with approve/reject buttons"""
    try:
        content = f"""
            <p class="greeting">Dear Manager,</p>
            <p>{employee_name} ({employee_email}) has submitted an expense request. Please review the details below:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Request Code:</span>
                    <span class="info-value">{request_code}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">{category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Amount:</span>
                    <span class="info-value">{currency} {amount}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Expense Date:</span>
                    <span class="info-value">{expense_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Description:</span>
                    <span class="info-value">{description or 'Not provided'}</span>
                </div>
            </div>
            <p>Please take action on this request:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{approve_url}" class="button">✅ Approve</a>
                <a href="{reject_url}" class="button reject-button">❌ Reject</a>
            </div>
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ Note:</strong> This action is required to proceed with the expense approval process.
                </p>
            </div>
            <p style="margin-top: 25px;">Thank you for your attention.</p>
            <p>Best regards,<br><strong>Nxzen Finance Team</strong></p>
        """
        html_body = get_email_template("💰 Expense Request Notification", content)
        await send_email(
            subject=f"💸 New Expense Request #{request_code} - Action Required",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Manager expense notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send manager expense notification: {e}")
        return False

async def send_hr_expense_notification(
    email: str, 
    employee_name: str, 
    employee_email: str, 
    request_code: str, 
    category: str, 
    amount: float, 
    currency: str, 
    description: str, 
    expense_date: str,
    approve_url: str, 
    reject_url: str
):
    """Send expense notification to HR with approve/reject buttons"""
    try:
        content = f"""
            <p class="greeting">Dear HR,</p>
            <p>An expense request from {employee_name} ({employee_email}) has been approved by their manager. Please review the details below:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Request Code:</span>
                    <span class="info-value">{request_code}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">{category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Amount:</span>
                    <span class="info-value">{currency} {amount}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Expense Date:</span>
                    <span class="info-value">{expense_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Description:</span>
                    <span class="info-value">{description or 'Not provided'}</span>
                </div>
            </div>
            <p>Please take action on this request:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{approve_url}" class="button">✅ Approve</a>
                <a href="{reject_url}" class="button reject-button">❌ Reject</a>
            </div>
            <div class="warning-box">
                <p class="warning-text">
                    <strong>⚠️ Note:</strong> Your approval will forward this to the Account Manager for final processing.
                </p>
            </div>
            <p style="margin-top: 25px;">Thank you for your attention.</p>
            <p>Best regards,<br><strong>Nxzen Finance Team</strong></p>
        """
        html_body = get_email_template("💰 Expense Request for HR Approval", content)
        await send_email(
            subject=f"💸 Expense Request #{request_code} - HR Approval Required",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ HR expense notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send HR expense notification: {e}")
        return False

async def send_account_manager_expense_notification(
    email: str, 
    employee_name: str, 
    employee_email: str, 
    request_code: str, 
    category: str, 
    amount: float, 
    currency: str, 
    description: str, 
    expense_date: str,
    approve_url: str, 
    reject_url: str
):
    """Send expense notification to Account Manager with approve/reject buttons"""
    try:
        content = f"""
            <p class="greeting">Dear Account Manager,</p>
            <p>An expense request from {employee_name} ({employee_email}) has been approved by both Manager and HR. Please review for final approval:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Request Code:</span>
                    <span class="info-value">{request_code}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">{category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Amount:</span>
                    <span class="info-value">{currency} {amount}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Expense Date:</span>
                    <span class="info-value">{expense_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Description:</span>
                    <span class="info-value">{description or 'Not provided'}</span>
                </div>
            </div>
            <p>Please take action on this request:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{approve_url}" class="button">✅ Approve</a>
                <a href="{reject_url}" class="button reject-button">❌ Reject</a>
            </div>
            <div class="success-box">
                <p class="success-text">
                    <strong>✓ Approved by:</strong> Manager & HR
                </p>
            </div>
            <p style="margin-top: 25px;">Thank you for your attention.</p>
            <p>Best regards,<br><strong>Nxzen Finance Team</strong></p>
        """
        html_body = get_email_template("💰 Expense Request for Final Approval", content)
        await send_email(
            subject=f"💸 Expense Request #{request_code} - Account Manager Approval Required",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Account Manager expense notification sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send Account Manager expense notification: {e}")
        return False

async def send_employee_expense_status(
    email: str, 
    request_code: str, 
    category: str, 
    amount: float, 
    currency: str, 
    expense_date: str, 
    status: str,
    rejected_by: str = None
):
    """Send expense status update to employee"""
    try:
        status_text = "approved" if status == "Approved" else "rejected"
        status_class = "success-box" if status == "Approved" else "warning-box"
        status_color = "#155724" if status == "Approved" else "#856404"
        
        rejection_info = f" by {rejected_by}" if rejected_by and status == "Rejected" else ""
        
        content = f"""
            <p class="greeting">Hello,</p>
            <p>Your expense request has been processed. Below are the details:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Request Code:</span>
                    <span class="info-value">{request_code}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Category:</span>
                    <span class="info-value">{category}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Amount:</span>
                    <span class="info-value">{currency} {amount}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Expense Date:</span>
                    <span class="info-value">{expense_date}</span>
                </div>
            </div>
            <div class="{status_class}">
                <p style="color: {status_color}; margin: 0;">
                    <strong>Status:</strong> Your expense request has been {status_text}{rejection_info}.
                </p>
            </div>
            <p style="margin-top: 25px;">If you have any questions, please contact the Finance or HR team.</p>
            <p>Best regards,<br><strong>Nxzen Finance Team</strong></p>
        """
        html_body = get_email_template(f"💰 Expense Request Status - {status}", content)
        await send_email(
            subject=f"💸 Your Expense Request #{request_code} has been {status} - Nxzen",
            recipients=[email],
            html_body=html_body,
        )
        logger.info(f"✅ Employee expense status email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send employee expense status email: {e}")
        return False

# ===========================
# SOFTWARE REQUEST EMAILS
# ===========================

async def send_new_request_email(
    manager_name: Optional[str],
    manager_email: Optional[str],
    it_admin_email: str,
    employee_name: str,
    employee_email: str,
    software_name: str,
    software_version: str,
    additional_info: Optional[str],
    business_unit_name: Optional[str],
    software_duration: Optional[str],
    approve_url: Optional[str] = None,
    reject_url: Optional[str] = None
):
    try:
        # --- Manager email with approve/reject buttons ---
        if manager_email and approve_url and reject_url:
            manager_content = f"""
                <p class="greeting">Dear {manager_name or 'Manager'},</p>
                <p>{employee_name} ({employee_email}) has submitted a software request. Please review the details:</p>
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-label">Software Name:</span>
                        <span class="info-value">{software_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Software Version:</span>
                        <span class="info-value">{software_version}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Business Unit:</span>
                        <span class="info-value">{business_unit_name or 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Software Duration:</span>
                        <span class="info-value">{software_duration or 'N/A'}</span>
                    </div>
                    {f'<div class="info-item"><span class="info-label">Additional Info:</span><span class="info-value">{additional_info}</span></div>' if additional_info else ''}
                </div>
                <p>Please take action:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{approve_url}" class="button">✅ Approve</a>
                    <a href="{reject_url}" class="button reject-button">❌ Reject</a>
                </div>
                <p style="margin-top: 25px;">Best regards,<br><strong>Nxzen IT Team</strong></p>
            """
            html_body = get_email_template("🖥️ Software Request Notification", manager_content)
            await send_email(
                subject="🖥️ New Software Request - Manager Action Required",
                recipients=[manager_email],
                html_body=html_body,
            )
            logger.info(f"✅ Manager email sent to {manager_email}")

        # --- IT Admin email (notification with manager info) ---
        it_content = f"""
            <p>Hello IT Team,</p>
            <p>{employee_name} ({employee_email}) has submitted a new software request. Here are the details:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{software_version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{software_duration or 'N/A'}</span>
                </div>
                {f'<div class="info-item"><span class="info-label">Additional Info:</span><span class="info-value">{additional_info}</span></div>' if additional_info else ''}
            </div>
            <div class="info-box" style="margin-top: 15px;">
                <div class="info-item">
                    <span class="info-label">Reporting Manager Name:</span>
                    <span class="info-value">{manager_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Reporting Manager Email:</span>
                    <span class="info-value">{manager_email or 'N/A'}</span>
                </div>
            </div>
            <p style="margin-top: 25px;">Best regards,<br><strong>Nxzen IT Team</strong></p>
        """
        html_body = get_email_template("🖥️ New Software Request", it_content)
        await send_email(
            subject="🖥️ New Software Request - Notification",
            recipients=[it_admin_email],
            html_body=html_body,
        )
        logger.info(f"✅ IT Admin email sent to {it_admin_email}")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to send software request emails: {e}")
        return False

async def send_approval_email_to_employee(employee: User, manager: User, request: SoftwareRequest, business_unit_name: Optional[str] = None):
    try:
        if not employee.company_email:
            logger.error(f"Cannot send approval email to employee: No email address provided")
            return False

        content = f"""
            <p>Hello {employee.name},</p>
            <p>Your software request has been <strong>approved</strong> by {manager.name} ({manager.company_email}).</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{request.software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{request.software_version or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{request.software_duration or 'N/A'}</span>
                </div>
                {f'<div class="info-item"><span class="info-label">Additional Info:</span><span class="info-value">{request.additional_info}</span></div>' if request.additional_info else ''}
            </div>
            <p>Best regards,<br><strong>Nxzen Team</strong></p>
        """
        html_body = get_email_template("Software Request Approved", content)
        await send_email(
            subject="Your Software Request Approved",
            recipients=[employee.company_email],
            html_body=html_body,
        )
        logger.info(f"✅ Approval email sent to Employee ({employee.company_email})")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send approval email to employee {employee.company_email}: {str(e)}")
        return False

async def send_approval_email_to_it(
    it_admin: User,
    employee: User,
    manager: User,
    request: SoftwareRequest,
    business_unit_name: Optional[str] = None
):
    try:
        if not it_admin.company_email:
            logger.error(f"Cannot send approval email to IT admin: No email address provided")
            return False

        content = f"""
            <p>Hello IT Team,</p>
            <p>The software request from {employee.name} ({employee.company_email}) has been <strong>approved</strong> by {manager.name} ({manager.company_email}).</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{request.software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{request.software_version or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{request.software_duration or 'N/A'}</span>
                </div>
                {f'<div class="info-item"><span class="info-label">Additional Info:</span><span class="info-value">{request.additional_info}</span></div>' if request.additional_info else ''}
            </div>
            <p>Please proceed with installation or required actions.</p>
            <p>Best regards,<br><strong>Nxzen Team</strong></p>
        """
        html_body = get_email_template("Software Request Approved", content)
        await send_email(
            subject="🖥️ Software Request Approved - Action Required",
            recipients=[it_admin.company_email],
            html_body=html_body,
        )
        logger.info(f"✅ Approval email sent to IT Admin ({it_admin.company_email})")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send approval email to IT admin {it_admin.company_email}: {str(e)}")
        return False

async def send_rejection_email(
    employee: User,
    it_admin: User,
    manager: User,
    request: SoftwareRequest,
    business_unit_name: Optional[str] = None,
    comments: Optional[str] = None
):
    try:
        # --- Email to Employee ---
        employee_content = f"""
            <p>Hello {employee.name},</p>
            <p>Your software request for <strong>{request.software_name}</strong> has been <strong>rejected</strong> by {manager.name} ({manager.company_email}).</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{request.software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{request.software_version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{request.software_duration or 'N/A'}</span>
                </div>
                {f'<div class="info-item"><span class="info-label">Comments:</span><span class="info-value">{comments}</span></div>' if comments else ''}
            </div>
            <p>Please contact your manager or IT team if you have any questions.</p>
            <p>Best regards,<br><strong>Nxzen Team</strong></p>
        """
        employee_html_body = get_email_template("Software Request Rejected", employee_content)
        await send_email(
            subject="Your Software Request Rejected",
            recipients=[employee.company_email],
            html_body=employee_html_body,
        )

        # --- Email to IT Admin ---
        it_content = f"""
            <p>Hello IT Team,</p>
            <p>The software request for <strong>{request.software_name}</strong> submitted by {employee.name} ({employee.company_email}) has been <strong>rejected</strong> by {manager.name} ({manager.company_email}).</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{request.software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{request.software_version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{request.software_duration or 'N/A'}</span>
                </div>
                {f'<div class="info-item"><span class="info-label">Comments:</span><span class="info-value">{comments}</span></div>' if comments else ''}
            </div>
            <p>No further action is required.</p>
            <p>Best regards,<br><strong>Nxzen Team</strong></p>
        """
        it_html_body = get_email_template("Software Request Rejected", it_content)
        await send_email(
            subject="Software Request Rejected - Action Notification",
            recipients=[it_admin.company_email],
            html_body=it_html_body,
        )

        logger.info(f"✅ Rejection emails sent: Employee ({employee.company_email}), IT Admin ({it_admin.company_email})")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send rejection emails: {e}")
        return False

async def send_completion_email(
    recipient: EmailStr,
    software_name: str,
    employee_name: str,
    business_unit_name: Optional[str] = None,
    software_duration: Optional[str] = None
):
    try:
        content = f"""
            <p class="greeting">Hello,</p>
            <p>Your software request has been completed successfully. Details are below:</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Requested By:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{software_duration or 'N/A'}</span>
                </div>
            </div>
            <p style="margin-top: 25px;">You can now access or start using the software.</p>
            <p>Best regards,<br><strong>Nxzen IT Team</strong></p>
        """
        html_body = get_email_template("Software Request Completed", content)
        await send_email(
            subject="Software Request Completed - Nxzen",
            recipients=[str(recipient)],
            html_body=html_body,
        )
        logger.info(f"✅ Completion email sent to {recipient}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send completion email: {e}")
        return False

async def send_compliance_email(
    employee_email: EmailStr,
    employee_name: str,
    software_name: str,
    questions: List[str],
    business_unit_name: Optional[str] = None,
    software_duration: Optional[str] = None,
):
    try:
        if not questions:
            logger.warning("No compliance questions provided for email")
            questions = ["No questions available at this time."]

        content = f"""
            <p>Hello {employee_name},</p>
            <p>Your software request for <strong>{software_name}</strong> requires additional compliance information.</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{software_duration or 'N/A'}</span>
                </div>
            </div>
            <p>Please log in to the Nxzen portal to answer the following compliance questions:</p>
            <div class="info-box">
                {''.join([f'<div>{i+1}. {q}</div>' for i, q in enumerate(questions)])}
            </div>
            <p>Once you complete the answers in the portal, your manager and IT Admin will be notified automatically.</p>
            <p>Best regards,<br><strong>Nxzen IT Team</strong></p>
        """
        html_body = get_email_template("Compliance Questions", content)
        await send_email(
            subject=f"Compliance Questions for {software_name} Installation",
            recipients=[str(employee_email)],
            html_body=html_body,
        )
        logger.info(f"✅ Compliance email sent to {employee_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send compliance email: {e}")
        return False

async def send_compliance_answers_email(
    it_admin_email: Optional[EmailStr],
    manager_email: Optional[EmailStr],
    employee_name: str,
    software_name: str,
    request_id: int,
    business_unit_name: Optional[str] = None,
    session: Session = Depends(get_session)
):
    try:
        recipients = [str(email) for email in [it_admin_email, manager_email] if email]
        if not recipients:
            logger.warning("No recipients for compliance answers email")
            return False

        # Fetch software request details
        db_request = session.get(SoftwareRequest, request_id)
        if not db_request:
            logger.error(f"Software request {request_id} not found")
            return False

        # Fetch compliance answers with corresponding questions
        query = (
            select(
                ComplianceAnswer.id,
                ComplianceAnswer.question_id,
                ComplianceAnswer.answer,
                ComplianceAnswer.created_at,
                ComplianceQuestion.question_text
            )
            .join(ComplianceQuestion, ComplianceQuestion.id == ComplianceAnswer.question_id)
            .where(ComplianceAnswer.request_id == request_id)
        )
        answers = session.exec(query).all()

        # Format answers as HTML list
        answers_html = "".join(
            f"<li><strong>{ans.question_text}</strong>: {ans.answer}</li>"
            for ans in answers
        ) if answers else "<li>No answers submitted yet.</li>"

        content = f"""
            <p>Hello,</p>
            <p>{employee_name} has submitted compliance answers for the software request for <strong>{software_name}</strong>.</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">Software Name:</span>
                    <span class="info-value">{software_name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Version:</span>
                    <span class="info-value">{db_request.software_version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Unit:</span>
                    <span class="info-value">{business_unit_name or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Software Duration:</span>
                    <span class="info-value">{db_request.software_duration or 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Requested By:</span>
                    <span class="info-value">{employee_name}</span>
                </div>
            </div>
            <p><strong>Compliance Answers:</strong></p>
            <ul>{answers_html}</ul>
            <p>Please review the answers in the portal.</p>
            <p>Best regards,<br><strong>Nxzen IT Team</strong></p>
        """
        html_body = get_email_template("Compliance Answers Submitted", content)
        await send_email(
            subject=f"Compliance Answers Submitted for {software_name}",
            recipients=recipients,
            html_body=html_body,
        )
        logger.info(f"✅ Compliance answers email sent successfully to {recipients}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send compliance answers email: {e}")
        return False