#
# Imports
#

# Perso

from app.config import get_settings
from app.features.health.schemas import HealthRead

#
# Controller
#

class HealthController:
    """
        Business logic for the healthcheck endpoint.
    """

    def get_health(self) -> HealthRead:
        """
            Returns:
                - Current health payload.
        """
        settings = get_settings()
        return HealthRead(
            status="ok",
            app=settings.APP_NAME,
            version=settings.APP_VERSION,
        )
