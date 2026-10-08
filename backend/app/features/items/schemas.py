############################################################
# EXAMPLE — feature CRUD de reference (desactivee).
# Garder ce dossier comme template pour de nouvelles features.
# Reactiver via app/shared/router.py et session.py.
############################################################

#
# Imports
#

from pydantic import BaseModel, ConfigDict, Field

# Perso

#
# Schemas
#

class ItemBase(BaseModel):
    """
        Shared fields for Item DTOs.
    """

    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Item title",
    )
    description: str = Field(
        default="",
        description="Optional item description",
    )


class ItemCreate(ItemBase):
    """
        Payload to create an item.
    """


class ItemUpdate(ItemBase):
    """
        Payload to update an item.
    """


class ItemRead(ItemBase):
    """
        Item as returned by the API.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Item unique identifier")
