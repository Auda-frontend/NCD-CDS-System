"""initial tables

Revision ID: 8581cbbc6a86
Revises:
Create Date: 2025-12-02 11:31:35.432293
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8581cbbc6a86"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---- PostgreSQL ENUM (create once, raw SQL) ----
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

    op.execute(text("""
    DO $$ BEGIN
        CREATE TYPE consultationtype AS ENUM (
            'initial',
            'follow_up',
            'emergency'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """))

    appointment_status_enum = postgresql.ENUM(
        "SCHEDULED",
        "ATTENDED",
        "MISSED",
        "CANCELLED",
        "RESCHEDULED",
        name="appointmentstatus",
        create_type=False,
    )

    consultation_type_enum = postgresql.ENUM(
        "initial",
        "follow_up",
        "emergency",
        name="consultationtype",
        create_type=False,
    )

    # ---- patients ----
    op.create_table(
        "patients",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("patient_id", sa.String(), unique=True, nullable=True),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("date_of_birth", sa.DateTime(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    # ---- appointments ----
    op.create_table(
        "appointments",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "patient_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", appointment_status_enum, nullable=True),
        sa.Column("missed_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_index("ix_appointments_patient_id", "appointments", ["patient_id"])

    # ---- visits ----
    op.create_table(
        "visits",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "patient_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("clinician", sa.String(), nullable=True),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("systole", sa.Integer(), nullable=True),
        sa.Column("diastole", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("height_cm", sa.Float(), nullable=True),
        sa.Column("bmi", sa.Float(), nullable=True),
        sa.Column("clinical_decisions", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_index("ix_visits_patient_id", "visits", ["patient_id"])

    # ---- prescriptions ----
    op.create_table(
        "prescriptions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "visit_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("visits.id"),
            nullable=False,
        ),
        sa.Column("medication", sa.String(), nullable=False),
        sa.Column("dose", sa.String(), nullable=True),
        sa.Column("frequency", sa.String(), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_index("ix_prescriptions_visit_id", "prescriptions", ["visit_id"])

    # ---- test_results ----
    op.create_table(
        "test_results",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "visit_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("visits.id"),
            nullable=False,
        ),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_index("ix_test_results_visit_id", "test_results", ["visit_id"])


def downgrade() -> None:
    op.drop_index("ix_test_results_visit_id", table_name="test_results")
    op.drop_table("test_results")

    op.drop_index("ix_prescriptions_visit_id", table_name="prescriptions")
    op.drop_table("prescriptions")

    op.drop_index("ix_visits_patient_id", table_name="visits")
    op.drop_table("visits")

    op.drop_index("ix_appointments_patient_id", table_name="appointments")
    
    # Convert enum column before dropping table
    op.execute(text("""
        ALTER TABLE appointments
        ALTER COLUMN status TYPE VARCHAR
        USING status::text;
    """))

    op.drop_table("appointments")
    op.drop_table("patients")

    # Drop enum type
    op.execute(text("DROP TYPE IF EXISTS appointmentstatus"))
    op.execute(text("DROP TYPE IF EXISTS consultationtype"))
