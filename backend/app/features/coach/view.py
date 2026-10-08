from fastapi import APIRouter

from app.dependencies import DbSession
from app.features.coach.controller import CoachController
from app.features.coach.schemas import DashboardRead

coach_routes = APIRouter(prefix="/coach", tags=["coach"])


@coach_routes.get("/dashboard/", response_model=DashboardRead)
async def dashboard(db: DbSession):
    """Vue agrégée de l'entraîneur : disponibilités, onze type, forme, charge, suivi, recrutement."""
    return await CoachController(db).dashboard()
