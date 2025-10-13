"""
Fix assets.allocation_history type to JSONB

Revision ID: 011_fix_allocation_history_jsonb
Revises: 010_create_leave_categories_and_departments_tables
Create Date: 2025-10-13
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = '011_fix_allocation_history_jsonb'
down_revision = '010_create_leave_categories_and_departments_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure column is jsonb and has a jsonb default []
    op.execute(
        """
        ALTER TABLE assets 
        ALTER COLUMN allocation_history TYPE jsonb USING allocation_history::jsonb;
        """
    )
    op.execute(
        """
        ALTER TABLE assets 
        ALTER COLUMN allocation_history SET DEFAULT '[]'::jsonb;
        """
    )
    # Backfill any NULLs to empty jsonb array
    op.execute(
        """
        UPDATE assets SET allocation_history = '[]'::jsonb WHERE allocation_history IS NULL;
        """
    )


def downgrade() -> None:
    # Revert to json text with default []
    op.execute(
        """
        ALTER TABLE assets 
        ALTER COLUMN allocation_history TYPE json USING allocation_history::json;
        """
    )
    op.execute(
        """
        ALTER TABLE assets 
        ALTER COLUMN allocation_history SET DEFAULT '[]'::json;
        """
    )

