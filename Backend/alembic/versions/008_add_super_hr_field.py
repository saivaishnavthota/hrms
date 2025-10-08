"""Add super_hr field to employees table

Revision ID: 008_add_super_hr
Revises: 007_create_company_policies_table
Create Date: 2025-01-30 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_add_super_hr'
down_revision = '007_create_company_policies_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add super_hr column to employees table
    op.execute("""
        ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS super_hr BOOLEAN DEFAULT FALSE;
    """)
    
    # Optionally, you can set a specific HR as super_hr by uncommenting and updating the following:
    # op.execute("""
    #     UPDATE employees 
    #     SET super_hr = TRUE 
    #     WHERE role = 'HR' AND id = 1;  -- Update with the appropriate HR ID
    # """)


def downgrade() -> None:
    # Remove super_hr column from employees table
    op.execute("""
        ALTER TABLE employees 
        DROP COLUMN IF EXISTS super_hr;
    """)

