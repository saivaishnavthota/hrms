"""Create company_policies table

Revision ID: 007
Revises: 006
Create Date: 2025-10-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'company_policies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.Text(), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('sections_json', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['location_id'], ['locations.id']),
        sa.ForeignKeyConstraint(['uploaded_by'], ['employees.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index for faster queries
    op.create_index('ix_company_policies_location_id', 'company_policies', ['location_id'])
    op.create_index('ix_company_policies_deleted_at', 'company_policies', ['deleted_at'])

def downgrade() -> None:
    op.drop_index('ix_company_policies_deleted_at', table_name='company_policies')
    op.drop_index('ix_company_policies_location_id', table_name='company_policies')
    op.drop_table('company_policies')
