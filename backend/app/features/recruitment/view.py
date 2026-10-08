from fastapi import APIRouter, HTTPException, Query, Response

from app.dependencies import DbSession
from app.features.recruitment.controller import RecruitmentController
from app.features.recruitment.schemas import ProfileCreate, ProfileRead, ProfileUpdate, ShortlistRead, SimilarRead
from app.shared.exceptions import AppError

recruitment_routes = APIRouter(prefix="/recruitment", tags=["recruitment"])


@recruitment_routes.get("/profiles/", response_model=list[ProfileRead])
async def list_profiles(db: DbSession):
    return await RecruitmentController(db).list_profiles()


@recruitment_routes.post("/profiles/", response_model=ProfileRead, status_code=201)
async def create_profile(payload: ProfileCreate, db: DbSession):
    return await RecruitmentController(db).create_profile(payload)


@recruitment_routes.put("/profiles/{profile_id}", response_model=ProfileRead)
async def update_profile(profile_id: int, payload: ProfileUpdate, db: DbSession):
    try:
        return await RecruitmentController(db).update_profile(profile_id, payload)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e


@recruitment_routes.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(profile_id: int, db: DbSession):
    try:
        await RecruitmentController(db).delete_profile(profile_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e
    return Response(status_code=204)


@recruitment_routes.get("/profiles/{profile_id}/candidates/", response_model=ShortlistRead)
async def shortlist(profile_id: int, db: DbSession, limit: int = Query(15, ge=1, le=60)):
    try:
        return await RecruitmentController(db).shortlist(profile_id, limit)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e


@recruitment_routes.get("/similar/{player_id}/", response_model=list[SimilarRead])
async def similar(player_id: str, db: DbSession, limit: int = Query(8, ge=1, le=30)):
    try:
        return await RecruitmentController(db).similar(player_id, limit)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e
