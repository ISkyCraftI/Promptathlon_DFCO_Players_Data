from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.physical.controller import PhysicalController
from app.features.players.controller import PlayerController, load_payloads
from app.features.players.model import PlayerFollowup
from app.features.recruitment.controller import RecruitmentController
from app.shared.football import simulation
from app.shared.football.catalog import ROLES

AVAILABLE = ("Disponible", "Vigilance")
# 4-3-3 : (libellé, x %, y %, groupe, postes FC préférés). y = 0 en haut (attaque).
FORMATION = [
    ("ATG", 18, 18, "Attaquant", ("LW", "LM", "ST")), ("BU", 50, 12, "Attaquant", ("ST",)),
    ("ATD", 82, 18, "Attaquant", ("RW", "RM", "ST")),
    ("MG", 28, 42, "Milieu", ("CM", "CAM", "LM")), ("MDC", 50, 52, "Milieu", ("CDM", "CM")),
    ("MD", 72, 42, "Milieu", ("CM", "CAM", "RM")),
    ("DG", 14, 70, "Défenseur", ("LB",)), ("DCG", 37, 76, "Défenseur", ("CB",)),
    ("DCD", 63, 76, "Défenseur", ("CB",)), ("DD", 86, 70, "Défenseur", ("RB",)),
    ("GB", 50, 92, "Gardien", ("GK",)),
]


def _depth_player(p: dict) -> dict:
    return dict(id=p["id"], name=p["name"], position=p["position"], status=p["status"], overall=p["overall"])


class CoachController:
    """Agrège effectif, physique, suivi et recrutement pour la vue de l'entraîneur."""

    def __init__(self, session: AsyncSession):
        self.session = session

    def _lineup(self, squad: list[dict]) -> list[dict]:
        pool = sorted([p for p in squad if p["status"] in AVAILABLE], key=lambda p: -(p["overall"] or 0))
        used: set[str] = set()
        slots = []
        for slot, x, y, role, preferred in FORMATION:
            pick = next((p for p in pool if p["id"] not in used and p["role"] == role and p["position"] in preferred), None) \
                or next((p for p in pool if p["id"] not in used and p["role"] == role), None)
            if pick:
                used.add(pick["id"])
            slots.append(dict(slot=slot, x=x, y=y, player=_depth_player(pick) if pick else None))
        return slots

    async def dashboard(self) -> dict:
        squad = await PlayerController(self.session).list_players("DFCO")
        payloads = {p["joueur_id"]: p for p in await load_payloads(self.session, "DFCO")}
        physical = await PhysicalController(self.session).overview()
        names = {p["id"]: p["name"] for p in squad}

        form = []
        for p in squad:
            matches = simulation.matches(payloads[p["id"]])
            rated = [m["rating"] for m in matches if m["rating"] is not None]
            if len(rated) >= 2:
                form.append(dict(id=p["id"], name=p["name"], role=p["role"], rating=round(sum(rated) / len(rated), 2),
                                 minutes=sum(m["minutes"] for m in matches), goals=sum(m["goals"] for m in matches),
                                 assists=sum(m["assists"] for m in matches),
                                 ratings=[m["rating"] for m in reversed(matches)]))
        form.sort(key=lambda f: f["rating"], reverse=True)

        followups = (await self.session.execute(select(PlayerFollowup).order_by(PlayerFollowup.id.desc()).limit(8))).scalars()
        activity = [dict(player_id=f.player_id, player_name=names.get(f.player_id, f.player_id), author=f.payload["author"],
                         note=f.payload["note"], date=f.payload["date"], fatigue=f.payload["fatigue"],
                         soreness=f.payload["soreness"]) for f in followups]

        rank = {"danger": 0, "warn": 1, "info": 2}
        priorities = sorted([dict(player_id=p["id"], player_name=p["name"], level=a["level"], title=a["title"],
                                  description=a["description"], section=a["section"]) for p in squad for a in p["alerts"]],
                            key=lambda a: rank[a["level"]])[:6]

        recruitment = RecruitmentController(self.session)
        pipeline = []
        for profile in await recruitment.list_profiles():
            top = (await recruitment.shortlist(profile["id"], 1))["candidates"]
            best = top[0] if top else None
            pipeline.append(dict(profile_id=profile["id"], profile_name=profile["name"], role=profile["role"],
                                 candidate_id=best and best["id"], candidate_name=best and best["name"],
                                 score=best and best["score"], delta_vs_squad=best and best["delta_vs_squad"],
                                 market_value=best and best["market_value"]))

        depth = [dict(role=role, total=len(group := [p for p in squad if p["role"] == role]),
                      available=sum(p["status"] in AVAILABLE for p in group),
                      players=[_depth_player(p) for p in sorted(group, key=lambda p: -(p["overall"] or 0))]) for role in ROLES]
        return dict(reference_date=physical["reference_date"], kpis=dict(
            squad_size=len(squad), available=sum(p["status"] == "Disponible" for p in squad),
            attention=sum(1 for p in squad if p["alerts"]),
            recovery=sum(p["status"] in ("Blessé", "Réathlétisation") for p in squad),
            open_flags=physical["team"]["open_flags"],
            avg_rating=round(sum(f["rating"] for f in form) / len(form), 2) if form else None,
            squad_value=sum(p["market_value"] for p in squad)),
            depth=depth, lineup=self._lineup(squad), form=form[:6], activity=activity, priorities=priorities,
            returns=physical["returns"], team_load=physical["team"], team_series=physical["team_series"], pipeline=pipeline)
