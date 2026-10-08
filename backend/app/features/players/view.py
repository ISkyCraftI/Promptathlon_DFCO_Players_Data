from typing import Literal

from fastapi import APIRouter, HTTPException

from app.dependencies import DbSession
from app.features.players.controller import PlayerController
from app.features.players.schemas import FollowupCreate, FollowupRead, PlayerDetailRead, PlayerRead
from app.shared.exceptions import AppError

player_routes = APIRouter(prefix="/players", tags=["players"])


@player_routes.get("/", response_model=list[PlayerRead])
async def list_players(db: DbSession, kind: Literal["DFCO", "PROSPECT", "ALL"] = "DFCO"):
    """Effectif DFCO par défaut ; `kind=PROSPECT` pour la base de recrutement, `ALL` pour tout."""
    return await PlayerController(db).list_players(None if kind == "ALL" else kind)


@player_routes.get("/{player_id}", response_model=PlayerDetailRead)
async def player_detail(player_id: str, db: DbSession):
    try:
        return await PlayerController(db).detail(player_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e


@player_routes.post("/{player_id}/followups/", response_model=FollowupRead, status_code=201)
async def add_followup(player_id: str, payload: FollowupCreate, db: DbSession):
    try:
        return await PlayerController(db).add_followup(player_id, payload)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e
