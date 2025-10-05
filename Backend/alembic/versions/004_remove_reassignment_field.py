"""Add reassignment field to employees table

Revision ID: 004_add_reassignment_field
Revises: 003_add_company_employee_id
Create Date: 2025-10-04 03:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_reassignment_field'
down_revision = '003_add_company_employee_id'
branch_labels = None
depends_on = None


def upgrade():
    # Add reassignment field to employees table
    op.add_column('employees', sa.Column('reassignment', sa.Boolean(), nullable=False, default=False))


def downgrade():
    # Remove reassignment field from employees table
    op.drop_column('employees', 'reassignment')
