# app/models/document_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Document(SQLModel, table=True):
    __tablename__ = "documents"

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