#
# Imports
#

from sqlalchemy.ext.asyncio import AsyncSession

# Perso

from app.features.players.controller import PlayerController, load_payloads
from app.shared.football import simulation
from app.shared.football.catalog import ROLES, YOUNG_MAX_AGE
from app.shared.football.valuation import (  # noqa: F401  (value_player ré-exporté pour les tests)
    FORMULA_VERSION,
    WAGE_TO_VALUE_RATIO,
    value_player,
)

#
# FinanceController
#


def _line(payload: dict) -> dict:
    valuation = value_player(payload, simulation.matches(payload))
    return dict(
        id=payload["joueur_id"],
        name=payload["nom"],
        kind=payload["type_joueur"],
        role=payload["groupe_poste"],
        position=payload.get("poste_fc27") or payload["groupe_poste"],
        age=payload["age"],
        overall=payload.get("note_generale_fc27"),
        status=payload["statut_sante"],
        market_value=valuation["final_valuation"],
        annual_wage=valuation["recommended_wage_ceiling"]["annual_euros"],
        injury_discount=valuation["injury_discount_factor"],
    )


class FinanceController:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.players = PlayerController(session)

    async def valuation(self, player_id: str) -> dict:
        """Effectif : valeur de marché. Prospect : coût de transfert estimé (même moteur)."""
        payload = (await self.players._get(player_id)).payload
        return value_player(payload, simulation.matches(payload))

    async def club(self) -> dict:
        """Valeur de l'effectif DFCO : total, masse salariale plafond, répartition par poste et par âge."""
        lines = sorted((_line(p) for p in await load_payloads(self.session, "DFCO")),
                       key=lambda line: line["market_value"], reverse=True)
        total = sum(line["market_value"] for line in lines)
        young = [line for line in lines if line["age"] <= YOUNG_MAX_AGE]
        unavailable = [line for line in lines if line["status"] in ("Blessé", "Réathlétisation")]
        by_role = []
        for role in ROLES:
            group = [line for line in lines if line["role"] == role]
            value = sum(line["market_value"] for line in group)
            by_role.append(dict(role=role, count=len(group), total_value=value,
                                share=round(value / total * 100, 1) if total else 0,
                                top_player=group[0]["name"] if group else None))
        prospects = [_line(p) for p in await load_payloads(self.session, "PROSPECT")]
        return dict(
            total_value=total,
            squad_size=len(lines),
            average_value=round(total / len(lines)) if lines else 0,
            annual_wage_ceiling=sum(line["annual_wage"] for line in lines),
            wage_to_value_ratio=WAGE_TO_VALUE_RATIO,
            young_value=sum(line["market_value"] for line in young),
            young_count=len(young),
            young_max_age=YOUNG_MAX_AGE,
            unavailable_value=sum(line["market_value"] for line in unavailable),
            unavailable_count=len(unavailable),
            prospects_count=len(prospects),
            prospects_median_cost=sorted(p["market_value"] for p in prospects)[len(prospects) // 2] if prospects else 0,
            by_role=by_role,
            players=lines,
            formula_version=FORMULA_VERSION,
        )
