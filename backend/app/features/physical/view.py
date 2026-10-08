from fastapi import APIRouter, HTTPException

from app.dependencies import DbSession
from app.features.physical.controller import PhysicalController
from app.features.physical.schemas import OverviewRead, PlayerLoadDetail, ReviewCreate, ReviewRead
from app.shared.exceptions import AppError

physical_routes = APIRouter(prefix="/physical", tags=["physical"])


@physical_routes.get("/overview/", response_model=OverviewRead)
async def overview(db: DbSession):
    return await PhysicalController(db).overview()


@physical_routes.get("/players/{player_id}/", response_model=PlayerLoadDetail)
async def player_load(player_id: str, db: DbSession):
    try:
        return await PhysicalController(db).player(player_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e


@physical_routes.post("/reviews/", response_model=ReviewRead, status_code=201)
async def add_review(payload: ReviewCreate, db: DbSession):
    try:
        return await PhysicalController(db).add_review(payload)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e
