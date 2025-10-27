"""Add project allocations and days tracking

Revision ID: 014
Revises: 013_add_entra_id_authentication_fields
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '014'
down_revision = '013_add_entra_id_authentication_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create project_allocations table
    op.create_table('project_allocations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('employee_name', sa.String(), nullable=False),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('level', sa.String(), nullable=True),
        sa.Column('client', sa.String(), nullable=True),
        sa.Column('service_line', sa.String(), nullable=True),
        sa.Column('month', sa.String(), nullable=False),
        sa.Column('allocated_days', sa.Float(), nullable=False, default=0.0),
        sa.Column('consumed_days', sa.Float(), nullable=False, default=0.0),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_project_allocations_employee_id'), 'project_allocations', ['employee_id'], unique=False)
    op.create_index(op.f('ix_project_allocations_project_id'), 'project_allocations', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_allocations_month'), 'project_allocations', ['month'], unique=False)
    
    # Add days_worked column to attendance_projects
    op.add_column('attendance_projects', sa.Column('days_worked', sa.Float(), nullable=False, default=1.0))
    
    # Add days_count column to attendance
    op.add_column('attendance', sa.Column('days_count', sa.Float(), nullable=False, default=1.0))


def downgrade() -> None:
    # Remove days_count column from attendance
    op.drop_column('attendance', 'days_count')
    
    # Remove days_worked column from attendance_projects
    op.drop_column('attendance_projects', 'days_worked')
    
    # Drop indexes
    op.drop_index(op.f('ix_project_allocations_month'), table_name='project_allocations')
    op.drop_index(op.f('ix_project_allocations_project_id'), table_name='project_allocations')
    op.drop_index(op.f('ix_project_allocations_employee_id'), table_name='project_allocations')
    
    # Drop project_allocations table
    op.drop_table('project_allocations')
