#
# Imports
#

from pydantic import BaseModel, Field

# Perso

#
# Schemas
#

class HealthRead(BaseModel):
    """
        Healthcheck response payload.
    """

    status: str = Field(
        ...,
        description="Service status string",
    )
    app: str = Field(
        ...,
        description="Application name",
    )
    version: str = Field(
        ...,
        description="Application version",
    )
