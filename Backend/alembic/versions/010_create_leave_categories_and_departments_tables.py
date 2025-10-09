"""Create leave_categories and departments tables

Revision ID: 010
Revises: 009
Create Date: 2025-01-09

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create leave_categories table
    op.create_table(
        'leave_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('default_days', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['created_by'], ['employees.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for faster queries
    op.create_index('ix_leave_categories_name', 'leave_categories', ['name'])
    op.create_index('ix_leave_categories_is_active', 'leave_categories', ['is_active'])
    
    # Create departments table
    op.create_table(
        'departments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['created_by'], ['employees.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for faster queries
    op.create_index('ix_departments_name', 'departments', ['name'])
    op.create_index('ix_departments_is_active', 'departments', ['is_active'])

def downgrade() -> None:
    # Drop departments table
    op.drop_index('ix_departments_is_active', table_name='departments')
    op.drop_index('ix_departments_name', table_name='departments')
    op.drop_table('departments')
    
    # Drop leave_categories table
    op.drop_index('ix_leave_categories_is_active', table_name='leave_categories')
    op.drop_index('ix_leave_categories_name', table_name='leave_categories')
    op.drop_table('leave_categories')

