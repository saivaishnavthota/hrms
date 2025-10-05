"""Fix expense attachments - rename file_path to file_url

Revision ID: 005
Revises: 004
Create Date: 2025-10-04

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Check if file_path column exists before attempting to rename
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'expense_attachments' 
                AND column_name = 'file_path'
            ) THEN
                ALTER TABLE expense_attachments RENAME COLUMN file_path TO file_url;
            END IF;
        END $$;
    """)
    
    # Update the add_expense_attachment function to use file_url
    op.execute("""
        CREATE OR REPLACE FUNCTION public.add_expense_attachment(
            p_request_id integer, 
            p_file_name character varying, 
            p_file_url text, 
            p_file_type character varying, 
            p_file_size numeric
        ) 
        RETURNS TABLE(
            attachment_id integer, 
            request_id integer, 
            file_name character varying, 
            file_url text,
            file_type character varying,
            file_size numeric,
            uploaded_at timestamp
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
            new_id INT;
        BEGIN
            INSERT INTO expense_attachments (
                request_id, file_name, file_url, file_type, file_size, uploaded_at
            ) VALUES (
                p_request_id, p_file_name, p_file_url, p_file_type, p_file_size, NOW()
            ) RETURNING expense_attachments.attachment_id INTO new_id;
            
            RETURN QUERY
            SELECT 
                ea.attachment_id,
                ea.request_id,
                ea.file_name,
                ea.file_url,
                ea.file_type,
                ea.file_size,
                ea.uploaded_at
            FROM expense_attachments ea
            WHERE ea.attachment_id = new_id;
        END;
        $$;
    """)

def downgrade() -> None:
    # Rename back to file_path
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'expense_attachments' 
                AND column_name = 'file_url'
            ) THEN
                ALTER TABLE expense_attachments RENAME COLUMN file_url TO file_path;
            END IF;
        END $$;
    """)
