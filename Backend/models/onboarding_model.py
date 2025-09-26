from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class candidate(SQLModel, table=True):
    __tablename__ = "onboarding_employees"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: Optional[str] = Field(max_length=100)
    email: Optional[str] = Field(max_length=100)
    password: Optional[str]
    role: Optional[str] = Field(max_length=100)
    o_status :Optional[bool]=Field(default=False)
    login_status :Optional[bool]=Field(default=False)

class onboard_emp_doc(SQLModel, table=True):
    __tablename__ = "onboarding_emp_docs"

    employee_id: int = Field(primary_key=True)
    aadhar: Optional[bytes] = None
    pan: Optional[bytes] = None
    latest_graduation_certificate: Optional[bytes] = None
    updated_resume: Optional[bytes] = None
    offer_letter: Optional[bytes] = None
    latest_compensation_letter: Optional[bytes] = None
    experience_relieving_letter: Optional[bytes] = None
    latest_3_months_payslips: Optional[bytes] = None
    form16_or_12b_or_taxable_income: Optional[bytes] = None
    ssc_certificate: Optional[bytes] = None
    hsc_certificate: Optional[bytes] = None
    hsc_marksheet: Optional[bytes] = None
    graduation_marksheet: Optional[bytes] = None
    postgraduation_marksheet: Optional[bytes] = None
    postgraduation_certificate: Optional[bytes] = None
    passport: Optional[bytes] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


