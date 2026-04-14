"""add_integration_audit_log

Revision ID: 8f19ac34e2d1
Revises: 4b47027ef03f
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8f19ac34e2d1"
down_revision: Union[str, Sequence[str], None] = "4b47027ef03f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "integration_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_integration_audit_logs_user_id"),
        "integration_audit_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_integration_audit_logs_event"),
        "integration_audit_logs",
        ["event"],
        unique=False,
    )
    op.create_index(
        op.f("ix_integration_audit_logs_provider"),
        "integration_audit_logs",
        ["provider"],
        unique=False,
    )
    op.create_index(
        op.f("ix_integration_audit_logs_created_at"),
        "integration_audit_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_integration_audit_logs_created_at"), table_name="integration_audit_logs")
    op.drop_index(op.f("ix_integration_audit_logs_provider"), table_name="integration_audit_logs")
    op.drop_index(op.f("ix_integration_audit_logs_event"), table_name="integration_audit_logs")
    op.drop_index(op.f("ix_integration_audit_logs_user_id"), table_name="integration_audit_logs")
    op.drop_table("integration_audit_logs")
