"""
	Routes HTTP de la feature prospection.
"""

#
# Imports
#

from fastapi import APIRouter, Query

# Perso

from app.dependencies import DbSession
from app.features.prospection.controller import (
    ProspectionController,
)
from app.features.prospection.schemas import (
    ProspectRead,
    SuggestionsResponse,
)

#
# Views (routes)
#

prospection_routes = APIRouter(
    prefix="/prospection",
    tags=["prospection"],
)


@prospection_routes.get(
    "/prospects/",
    response_model=list[ProspectRead],
)
async def search_prospects(
    db: DbSession,
    q: str | None = Query(default=None),
    role: str | None = Query(default=None),
    foot: str | None = Query(default=None),
    age_min: int | None = Query(default=None, ge=15, le=45),
    age_max: int | None = Query(default=None, ge=15, le=45),
    overall_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    vitesse_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    frappe_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    passe_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    dribble_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    defense_min: int | None = Query(
        default=None, ge=0, le=99
    ),
    physique_min: int | None = Query(
        default=None, ge=0, le=99
    ),
) -> list[ProspectRead]:
    return await ProspectionController(db).search(
        q=q,
        role=role,
        foot=foot,
        age_min=age_min,
        age_max=age_max,
        overall_min=overall_min,
        vitesse_min=vitesse_min,
        frappe_min=frappe_min,
        passe_min=passe_min,
        dribble_min=dribble_min,
        defense_min=defense_min,
        physique_min=physique_min,
    )


@prospection_routes.get(
    "/suggestions/",
    response_model=SuggestionsResponse,
)
async def list_suggestions(
    db: DbSession,
    limit: int = Query(default=8, ge=1, le=20),
    role: str | None = Query(default=None),
) -> SuggestionsResponse:
    return await ProspectionController(db).suggestions(
        limit=limit,
        role=role,
    )
