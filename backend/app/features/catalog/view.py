from fastapi import APIRouter

from app.features.catalog.controller import CatalogController
from app.features.catalog.schemas import CatalogRead

catalog_routes = APIRouter(prefix="/catalog", tags=["catalog"])


@catalog_routes.get("/", response_model=CatalogRead)
async def get_catalog():
    return CatalogController().get()
