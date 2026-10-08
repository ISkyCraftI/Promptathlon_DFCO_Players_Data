from fastapi import APIRouter, HTTPException

from app.dependencies import DbSession
from app.features.comparison.controller import ComparisonController
from app.features.comparison.schemas import CandidatesRead, ComparisonRead, Mode
from app.shared.exceptions import AppError

comparison_routes = APIRouter(prefix="/comparison", tags=["comparison"])


@comparison_routes.get("/players/", response_model=CandidatesRead)
async def candidates(db: DbSession, mode: Mode = "young"):
    """Joueurs comparés et références du collectif DFCO pour le mode choisi (jeunes, collectif, prospects)."""
    return await ComparisonController(db).candidates(mode)


@comparison_routes.get("/", response_model=ComparisonRead)
async def compare(subject_id: str, db: DbSession, reference_id: str | None = None, mode: Mode = "young"):
    """Sans `reference_id`, la référence du collectif est choisie automatiquement (même poste, style le plus proche)."""
    try:
        return await ComparisonController(db).compare(subject_id, reference_id, mode)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.to_detail()) from e
