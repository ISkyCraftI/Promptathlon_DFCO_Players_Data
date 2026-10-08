#
# Imports
#

from fastapi import APIRouter

# Perso

from app.features.catalog.view import catalog_routes
from app.features.coach.view import coach_routes
from app.features.comparison.view import comparison_routes
from app.features.finance.view import finance_routes
from app.features.health.view import health_routes
from app.features.physical.view import physical_routes
from app.features.players.view import player_routes
from app.features.prospection.view import prospection_routes
from app.features.recruitment.view import recruitment_routes

# EXAMPLE — feature CRUD de référence (désactivée).
# Pour réactiver : décommenter l'import et include_router ci-dessous.
# Voir aussi app/features/items/ et frontend/src/app/items/.
# from app.features.items.view import item_routes

#
# Routes
#

routes = APIRouter()

routes.include_router(health_routes)
routes.include_router(player_routes)
routes.include_router(catalog_routes)
routes.include_router(recruitment_routes)
routes.include_router(comparison_routes)
routes.include_router(physical_routes)
routes.include_router(coach_routes)
routes.include_router(prospection_routes)
routes.include_router(finance_routes)

# EXAMPLE
# routes.include_router(item_routes)
