"""Add status column to appointments

Revision ID: add_status_to_appointments
Revises: e97623584ab2
Create Date: 2025-12-16
"""

from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = "add_status_to_appointments"
down_revision = "e97623584ab2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration is idempotent - it only adds the column if it doesn't exist
    # Since the initial migration (8581cbbc6a86) already creates the status column,
    # this migration will typically be a no-op, but it ensures the enum type exists
    # and handles cases where the initial migration wasn't run
    
    # Ensure enum type exists
    op.execute(text("""
        DO $$ BEGIN
            CREATE TYPE appointmentstatus AS ENUM (
                'SCHEDULED',
                'ATTENDED',
                'MISSED',
                'CANCELLED',
                'RESCHEDULED'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Only add column if it doesn't exist (check first to avoid error)
    op.execute(text("""
        DO $$ 
        BEGIN
            -- Check if column exists before trying to add it
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'appointments' 
                AND column_name = 'status'
            ) THEN
                -- Column doesn't exist, create it
                ALTER TABLE appointments 
                ADD COLUMN status appointmentstatus;
                
                -- Set default for any existing rows
                UPDATE appointments SET status = 'SCHEDULED' WHERE status IS NULL;
                
                -- Make it NOT NULL
                ALTER TABLE appointments 
                ALTER COLUMN status SET NOT NULL;
            END IF;
            
            -- Ensure column is using enum type (convert if needed)
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public'
                AND table_name = 'appointments' 
                AND column_name = 'status' 
                AND udt_name IS NOT NULL
                AND udt_name != 'appointmentstatus'
            ) THEN
                -- Convert to enum type if it's not already
                ALTER TABLE appointments 
                ALTER COLUMN status TYPE appointmentstatus 
                USING status::appointmentstatus;
            END IF;
        END $$;
    """))


def downgrade() -> None:
    op.drop_column("appointments", "status")
    appointment_status_enum = sa.Enum(
        "SCHEDULED",
        "ATTENDED",
        "MISSED",
        "CANCELLED",
        "RESCHEDULED",
        name="appointmentstatus",
    )
    appointment_status_enum.drop(op.get_bind(), checkfirst=True)

