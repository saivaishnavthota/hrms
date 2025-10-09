"""Add discount and tax fields to expense_requests table

Revision ID: 009_add_expense_discount_tax
Revises: 008_add_super_hr
Create Date: 2025-01-30 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_add_expense_discount_tax'
down_revision = '008_add_super_hr'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add discount and tax fields to expense_requests table
    op.execute("""
        ALTER TABLE expense_requests 
        ADD COLUMN IF NOT EXISTS discount_percentage FLOAT,
        ADD COLUMN IF NOT EXISTS cgst_percentage FLOAT,
        ADD COLUMN IF NOT EXISTS sgst_percentage FLOAT,
        ADD COLUMN IF NOT EXISTS final_amount FLOAT;
    """)
    
    # Update existing records to set final_amount equal to amount if not set
    op.execute("""
        UPDATE expense_requests 
        SET final_amount = amount 
        WHERE final_amount IS NULL;
    """)
    
    # Set default values for new percentage fields if needed
    op.execute("""
        UPDATE expense_requests 
        SET discount_percentage = 0 
        WHERE discount_percentage IS NULL;
    """)
    
    op.execute("""
        UPDATE expense_requests 
        SET cgst_percentage = 0 
        WHERE cgst_percentage IS NULL;
    """)
    
    op.execute("""
        UPDATE expense_requests 
        SET sgst_percentage = 0 
        WHERE sgst_percentage IS NULL;
    """)


def downgrade() -> None:
    # Remove discount and tax fields from expense_requests table
    op.execute("""
        ALTER TABLE expense_requests 
        DROP COLUMN IF EXISTS discount_percentage,
        DROP COLUMN IF EXISTS cgst_percentage,
        DROP COLUMN IF EXISTS sgst_percentage,
        DROP COLUMN IF EXISTS final_amount;
    """)

