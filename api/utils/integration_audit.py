from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from api.models import IntegrationAuditLog
from api.utils.logging_config import get_logger

logger = get_logger(__name__)


def emit_integration_event(
    *,
    event: str,
    provider: str | None = None,
    user_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
    db: Session | None = None,
) -> None:
    """Emit an integration event to logs and optionally persist it in DB."""
    safe_metadata = metadata or {}

    logger.info(
        "Integration event",
        extra={
            "event": event,
            "provider": provider,
            "user_id": str(user_id) if user_id else None,
            "metadata": safe_metadata,
        },
    )

    if db is None:
        return

    db.add(
        IntegrationAuditLog(
            user_id=user_id,
            event=event,
            provider=provider,
            metadata_json=safe_metadata,
        )
    )
