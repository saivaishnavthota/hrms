"""Add deleted_at column to expense_requests table

Revision ID: 006
Revises: 005
Create Date: 2025-10-04

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add deleted_at column to expense_requests table for soft deletes
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'expense_requests' 
                AND column_name = 'deleted_at'
            ) THEN
                ALTER TABLE expense_requests ADD COLUMN deleted_at TIMESTAMP NULL;
            END IF;
        END $$;
    """)

def downgrade() -> None:
    # Remove deleted_at column
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'expense_requests' 
                AND column_name = 'deleted_at'
            ) THEN
                ALTER TABLE expense_requests DROP COLUMN deleted_at;
            END IF;
        END $$;
    """)
