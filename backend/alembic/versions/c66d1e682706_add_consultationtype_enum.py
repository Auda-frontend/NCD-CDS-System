"""add consultationtype enum

Revision ID: c66d1e682706
Revises: 751cbc91c85c
Create Date: 2025-12-19 11:01:22.667401

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'c66d1e682706'
down_revision: Union[str, None] = '751cbc91c85c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create consultationtype enum
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


def downgrade() -> None:
    # Drop consultationtype enum
    op.execute(text("DROP TYPE IF EXISTS consultationtype"))
