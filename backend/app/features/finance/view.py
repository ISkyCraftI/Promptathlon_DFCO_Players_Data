#
# Imports
#

from fastapi import APIRouter, HTTPException, status

# Perso

from app.dependencies import DbSession
from app.features.finance.controller import FinanceController
from app.features.finance.schemas import ClubValueRead, ValuationRead
from app.shared.exceptions import AppError

#
# Views (routes)
#

finance_routes = APIRouter(prefix="/finance", tags=["finance"])


@finance_routes.get(
    "/club/",
    response_model=ClubValueRead,
    status_code=status.HTTP_200_OK,
    summary="Valeur de l’effectif DFCO",
)
async def club_value(db: DbSession) -> ClubValueRead:
    """
        Somme des valorisations de tous les joueurs du club, répartition par poste.
    """
    return await FinanceController(session=db).club()


@finance_routes.get(
    "/{player_id}/",
    response_model=ValuationRead,
    status_code=status.HTTP_200_OK,
    summary="Valorisation financière auditable d’un joueur",
)
async def player_valuation(
    player_id: str,
    db: DbSession,
) -> ValuationRead:
    """
        Calcule la valeur de transfert et le plafond salarial.
    """
    controller = FinanceController(session=db)
    try:
        return await controller.valuation(player_id)
    except AppError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_detail(),
        ) from e
