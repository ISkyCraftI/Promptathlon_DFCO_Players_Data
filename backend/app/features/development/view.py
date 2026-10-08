from fastapi import APIRouter, HTTPException

from app.dependencies import DbSession
from app.features.development.controller import DevelopmentController
from app.features.development.schemas import ComparisonRead, CompareRequest, ProfileCreate, ProfileRead
from app.shared.exceptions import AppError

development_routes = APIRouter(prefix="/development", tags=["development"])


@development_routes.get("/profiles/", response_model=list[ProfileRead])
async def profiles(db: DbSession):
    return await DevelopmentController(db).profiles()


@development_routes.post("/profiles/", response_model=ProfileRead, status_code=201)
async def create_profile(payload: ProfileCreate, db: DbSession):
    return await DevelopmentController(db).save(payload)


@development_routes.put("/profiles/{profile_id}", response_model=ProfileRead)
async def update_profile(profile_id: str, payload: ProfileCreate, db: DbSession):
    try:
        return await DevelopmentController(db).save(payload, profile_id)
    except AppError as error:
        raise HTTPException(status_code=404, detail=error.to_detail()) from error


@development_routes.post("/compare/", response_model=ComparisonRead)
async def compare(payload: CompareRequest, db: DbSession):
    try:
        return await DevelopmentController(db).compare(payload)
    except AppError as error:
        raise HTTPException(status_code=400, detail=error.to_detail()) from error
