"""Add company_employee_id column to employees table

Revision ID: 003_add_company_employee_id
Revises: 002_postgresql_functions
Create Date: 2025-01-30 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_company_employee_id'
down_revision = '002_postgresql_functions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add company_employee_id column to employees table
    op.add_column('employees', sa.Column('company_employee_id', sa.String(length=50), nullable=True))


def downgrade() -> None:
    # Remove company_employee_id column from employees table
    op.drop_column('employees', 'company_employee_id')
