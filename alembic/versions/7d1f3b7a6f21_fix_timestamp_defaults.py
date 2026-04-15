"""fix_timestamp_defaults

Revision ID: 7d1f3b7a6f21
Revises: 0e7b4d92fa11
Create Date: 2026-04-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7d1f3b7a6f21"
down_revision: Union[str, Sequence[str], None] = "0e7b4d92fa11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _set_now_default(table_name: str, column_name: str) -> None:
    op.alter_column(
        table_name,
        column_name,
        server_default=sa.text("now()"),
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=False,
    )


def upgrade() -> None:
    # created_at / linked_at / assigned_at defaults
    for table_name, column_name in [
        ("users", "created_at"),
        ("users", "updated_at"),
        ("cars", "created_at"),
        ("cars", "updated_at"),
        ("social_accounts", "linked_at"),
        ("social_sessions", "created_at"),
        ("car_drivers", "assigned_at"),
        ("invitations", "created_at"),
        ("rides", "created_at"),
        ("integration_audit_logs", "created_at"),
    ]:
        _set_now_default(table_name, column_name)


def downgrade() -> None:
    for table_name, column_name in [
        ("users", "created_at"),
        ("users", "updated_at"),
        ("cars", "created_at"),
        ("cars", "updated_at"),
        ("social_accounts", "linked_at"),
        ("social_sessions", "created_at"),
        ("car_drivers", "assigned_at"),
        ("invitations", "created_at"),
        ("rides", "created_at"),
        ("integration_audit_logs", "created_at"),
    ]:
        op.alter_column(
            table_name,
            column_name,
            server_default="now()",
            existing_type=sa.DateTime(timezone=True),
            existing_nullable=False,
        )
