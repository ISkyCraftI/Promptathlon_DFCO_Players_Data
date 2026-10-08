#
# Imports
#

from fastapi import APIRouter, status

# Perso

from app.features.health.controller import HealthController
from app.features.health.schemas import HealthRead

#
# Views (routes)
#

health_routes = APIRouter(prefix="/health", tags=["health"])


@health_routes.get(
    "/",
    response_model=HealthRead,
    status_code=status.HTTP_200_OK,
    summary="Healthcheck",
)
async def get_health() -> HealthRead:
    """
        Return a simple health payload (no auth).
    """
    controller = HealthController()
    return controller.get_health()
