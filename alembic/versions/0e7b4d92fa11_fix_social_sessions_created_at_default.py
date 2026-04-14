"""fix_social_sessions_created_at_default

Revision ID: 0e7b4d92fa11
Revises: 9a2b1c35f4e2
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0e7b4d92fa11"
down_revision: Union[str, Sequence[str], None] = "9a2b1c35f4e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "social_sessions",
        "created_at",
        server_default=sa.text("now()"),
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "social_sessions",
        "created_at",
        server_default="now()",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )
