"""Add status column to appointments

Revision ID: add_status_to_appointments
Revises: e97623584ab2
Create Date: 2025-12-16
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_status_to_appointments"
down_revision = "e97623584ab2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    appointment_status_enum = sa.Enum(
        "SCHEDULED",
        "ATTENDED",
        "MISSED",
        "CANCELLED",
        "RESCHEDULED",
        name="appointmentstatus",
    )
    # Create enum type if it doesn't exist (safe for repeated runs)
    appointment_status_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "appointments",
        sa.Column(
            "status",
            appointment_status_enum,
            nullable=False,
            server_default="SCHEDULED",
        ),
    )
    # Optional: drop the server default afterwards to avoid future implicit defaults
    op.alter_column("appointments", "status", server_default=None)


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

