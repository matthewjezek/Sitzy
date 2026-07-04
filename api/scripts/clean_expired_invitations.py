import logging
from datetime import datetime, timezone

from api.database import SessionLocal
from api.models import Invitation
from api.utils.enums import InvitationStatus

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("clean_expired_invitations")


def clean_expired_invitations() -> None:
    logger.info("Starting cleanup of expired invitations...")
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        # Perform a bulk update for optimal performance (single database query)
        count = (
            db.query(Invitation)
            .filter(
                Invitation.status == InvitationStatus.PENDING,
                Invitation.expires_at < now,
            )
            .update(
                {Invitation.status: InvitationStatus.EXPIRED},
                synchronize_session=False,
            )
        )

        if count == 0:
            logger.info("No expired pending invitations found.")
            return

        logger.info(
            f"""Successfully marked {count} expired pending invitation(s) as EXPIRED
            in the database."""
        )
        db.commit()
        logger.info("Successfully committed changes to database.")
    except Exception as e:
        logger.error(f"Error occurred during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    clean_expired_invitations()
