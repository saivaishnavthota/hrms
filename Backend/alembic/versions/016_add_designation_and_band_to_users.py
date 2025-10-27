"""Add designation and band to users

Revision ID: 016
Revises: 015
Create Date: 2025-01-24 08:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    # Add designation and band columns to employees table
    op.add_column('employees', sa.Column('designation', sa.String(200), nullable=True))
    op.add_column('employees', sa.Column('band', sa.String(50), nullable=True))


def downgrade():
    # Remove designation and band columns from employees table
    op.drop_column('employees', 'band')
    op.drop_column('employees', 'designation')
