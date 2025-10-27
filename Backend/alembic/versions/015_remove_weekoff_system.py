"""Remove weekoff system

Revision ID: 015
Revises: 014_add_project_allocations_and_days_tracking
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '015'
down_revision = '014_add_project_allocations_and_days_tracking'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop weekoffs table
    op.drop_table('weekoffs')


def downgrade() -> None:
    # Recreate weekoffs table (if needed for rollback)
    op.create_table('weekoffs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('week_start', sa.Date(), nullable=False),
        sa.Column('week_end', sa.Date(), nullable=False),
        sa.Column('off_days', postgresql.ARRAY(sa.String()), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
