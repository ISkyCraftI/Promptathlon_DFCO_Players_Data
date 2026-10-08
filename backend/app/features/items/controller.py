############################################################
# EXAMPLE — feature CRUD de reference (desactivee).
# Garder ce dossier comme template pour de nouvelles features.
# Reactiver via app/shared/router.py et session.py.
############################################################

#
# Imports
#

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Perso

from app.features.items.model import Item
from app.features.items.schemas import ItemCreate, ItemUpdate
from app.shared.exceptions import AppError

#
# Controller
#

class ItemController:
    """
        Business logic for Items (example CRUD feature).
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_items(self) -> list[Item]:
        """
            Returns:
                - All items ordered by id.
        """
        result = await self._session.execute(
            select(Item).order_by(Item.id)
        )
        return list(result.scalars().all())

    async def get_item(self, item_id: int) -> Item:
        """
            Params:
                - item_id (int): Target item id.

            Returns:
                - The matching Item.

            Raises:
                - AppError: If the item does not exist.
        """
        item = await self._session.get(Item, item_id)
        if item is None:
            raise AppError(
                user_safe_title="Élément introuvable",
                user_safe_description=(
                    "L'élément demandé n'existe pas."
                ),
                dev=f"Item id={item_id} not found",
            )
        return item

    async def create_item(self, payload: ItemCreate) -> Item:
        """
            Params:
                - payload (ItemCreate): Creation DTO.

            Returns:
                - The created Item.
        """
        item = Item(
            title=payload.title,
            description=payload.description,
        )
        self._session.add(item)
        await self._session.commit()
        await self._session.refresh(item)
        return item

    async def update_item(
        self,
        item_id: int,
        payload: ItemUpdate,
    ) -> Item:
        """
            Params:
                - item_id (int): Target item id.
                - payload (ItemUpdate): Update DTO.

            Returns:
                - The updated Item.
        """
        item = await self.get_item(item_id)
        item.title = payload.title
        item.description = payload.description
        await self._session.commit()
        await self._session.refresh(item)
        return item

    async def delete_item(self, item_id: int) -> None:
        """
            Params:
                - item_id (int): Target item id.
        """
        item = await self.get_item(item_id)
        await self._session.delete(item)
        await self._session.commit()
