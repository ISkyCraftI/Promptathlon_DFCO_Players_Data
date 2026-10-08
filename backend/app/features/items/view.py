############################################################
# EXAMPLE — feature CRUD de reference (desactivee).
# Garder ce dossier comme template pour de nouvelles features.
# Reactiver via app/shared/router.py et session.py.
############################################################

#
# Imports
#

from typing import List

from fastapi import APIRouter, HTTPException, status

# Perso

from app.dependencies import DbSession
from app.features.items.controller import ItemController
from app.features.items.schemas import ItemCreate, ItemRead, ItemUpdate
from app.shared.exceptions import AppError

#
# Views (routes)
#

item_routes = APIRouter(prefix="/items", tags=["items"])


@item_routes.get(
    "/",
    response_model=List[ItemRead],
    status_code=status.HTTP_200_OK,
    summary="List all items",
)
async def list_items(db: DbSession) -> List[ItemRead]:
    """
        List all items.
    """
    controller = ItemController(session=db)
    return await controller.list_items()


@item_routes.get(
    "/{item_id}",
    response_model=ItemRead,
    status_code=status.HTTP_200_OK,
    summary="Get one item",
)
async def get_item(item_id: int, db: DbSession) -> ItemRead:
    """
        Get a single item by id.
    """
    controller = ItemController(session=db)
    try:
        return await controller.get_item(item_id)
    except AppError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.to_detail(),
        ) from e


@item_routes.post(
    "/",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an item",
)
async def create_item(
    payload: ItemCreate,
    db: DbSession,
) -> ItemRead:
    """
        Create a new item.
    """
    controller = ItemController(session=db)
    return await controller.create_item(payload)


@item_routes.put(
    "/{item_id}",
    response_model=ItemRead,
    status_code=status.HTTP_200_OK,
    summary="Update an item",
)
async def update_item(
    item_id: int,
    payload: ItemUpdate,
    db: DbSession,
) -> ItemRead:
    """
        Update an existing item.
    """
    controller = ItemController(session=db)
    try:
        return await controller.update_item(item_id, payload)
    except AppError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.to_detail(),
        ) from e


@item_routes.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an item",
)
async def delete_item(item_id: int, db: DbSession) -> None:
    """
        Delete an item by id.
    """
    controller = ItemController(session=db)
    try:
        await controller.delete_item(item_id)
    except AppError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.to_detail(),
        ) from e
