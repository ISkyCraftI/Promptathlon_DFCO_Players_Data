from app.shared.football.catalog import catalog
from app.shared.football.workload import ZONES


class CatalogController:
    """Référentiel statique (pas d'accès DB) : attributs, postes, pondérations, zones de charge."""

    def get(self) -> dict:
        return catalog() | dict(load_zones=[dict(key=k, label=l, min=lo, max=hi) for k, l, lo, hi in ZONES])
