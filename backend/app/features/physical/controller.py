from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.physical.model import LoadReview
from app.features.physical.schemas import ReviewCreate
from app.features.players.controller import latest_followups, load_payloads, recovery, summary
from app.features.players.model import Player, PlayerFollowup
from app.shared.exceptions import NotFoundError
from app.shared.football import simulation, workload


def _flags(s: dict, rec: dict, latest: PlayerFollowup | None, reviewed: set[str]) -> list[dict]:
    out = []
    injured = s["status"] in ("Blessé", "Réathlétisation")
    if not injured and s["load_zone"] == "risque":
        out.append(dict(code="acwr_high", level="danger", label="Surcharge aiguë",
                        detail=f"ACWR {workload.fr_ratio(s['acwr'])} : la semaine dépasse nettement l'habitude des 4 dernières."))
    elif not injured and s["load_zone"] == "vigilance":
        out.append(dict(code="acwr_high", level="warn", label="Charge en hausse",
                        detail=f"ACWR {workload.fr_ratio(s['acwr'])} : à surveiller sur les prochaines séances."))
    if not injured and s["load_zone"] == "sous-charge":
        out.append(dict(code="acwr_low", level="info", label="Sous-charge",
                        detail=f"ACWR {workload.fr_ratio(s['acwr'])} : risque de déconditionnement si cela se prolonge."))
    if not injured and s["load_change"] > 30:
        out.append(dict(code="load_spike", level="warn", label="Pic hebdomadaire",
                        detail=f"+{s['load_change']:.0f} % par rapport à la semaine précédente."))
    if s["fatigue"] >= 60:
        out.append(dict(code="fatigue", level="warn", label="Fatigue élevée", detail=f"Fatigue déclarée {s['fatigue']}/100."))
    if latest and latest.payload["soreness"] >= 4:
        out.append(dict(code="soreness", level="warn", label="Gêne déclarée",
                        detail=f"Gêne {latest.payload['soreness']}/10 au dernier bilan."))
    if rec["active"] and rec["days_left"] is not None and rec["days_left"] <= 7:
        out.append(dict(code="return_soon", level="info", label="Retour imminent",
                        detail=f"Retour prévu dans {rec['days_left']} j : valider la reprise avec le staff médical."))
    return [f | dict(reviewed=f["code"] in reviewed) for f in out]


def _rtp(p: dict, rec: dict) -> dict:
    return dict(id=p["joueur_id"], name=p["nom"], role=p["groupe_poste"], status=p["statut_sante"], injury=rec["injury"],
                phase=rec["phase"], progress=rec["progress"], current_step=rec["current_step"], steps=rec["steps"],
                return_date=rec["return_date"], days_left=rec["days_left"])


class PhysicalController:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _reviews(self) -> dict[str, set[str]]:
        out: dict[str, set[str]] = {}
        for r in (await self.session.execute(select(LoadReview))).scalars():
            out.setdefault(r.player_id, set()).add(r.flag)
        return out

    def _player_load(self, p: dict, latest: PlayerFollowup | None, reviewed: set[str]) -> dict:
        s = summary(p, latest)
        rec = recovery(p)
        reference = date.fromisoformat(p["date_reference"])
        _, chronic, _ = workload.acute_chronic(simulation.sessions(p), reference)
        trend = [d["load"] for d in workload.daily_loads(simulation.sessions(p), reference, 14)]
        return dict(id=s["id"], name=s["name"], role=s["role"], position=s["position"], status=s["status"],
                    availability=s["availability"], acute=s["weekly_load"], chronic=chronic, acwr=s["acwr"],
                    zone=s["load_zone"], zone_label=workload.RETURN_ZONE["label"] if s["load_zone"] == "retour" else workload.zone(s["acwr"])["label"], load_change=s["load_change"],
                    fatigue=s["fatigue"], flags=_flags(s, rec, latest, reviewed), trend=trend)

    async def overview(self) -> dict:
        payloads = await load_payloads(self.session, "DFCO")
        latest = await latest_followups(self.session)
        reviews = await self._reviews()
        players = [self._player_load(p, latest.get(p["joueur_id"]), reviews.get(p["joueur_id"], set())) for p in payloads]
        reference = date.fromisoformat(payloads[0]["date_reference"])
        series_by_player = [workload.rolling_series(simulation.sessions(p), reference) for p in payloads]
        team_series = []
        for i, point in enumerate(series_by_player[0]):
            column = [s[i] for s in series_by_player]
            ratios = [c["acwr"] for c in column if c["acwr"] is not None]
            chronic = [c["chronic"] for c in column if c["chronic"] is not None]
            team_series.append(dict(date=point["date"], load=round(sum(c["load"] for c in column) / len(column), 1),
                                    acute=round(sum(c["acute"] for c in column) / len(column), 1),
                                    chronic=round(sum(chronic) / len(chronic), 1) if chronic else None,
                                    acwr=round(sum(ratios) / len(ratios), 2) if ratios else None))
        active = [p for p in players if p["status"] not in ("Blessé", "Réathlétisation")]
        ratios = [p["acwr"] for p in active if p["acwr"] is not None]
        changes = [p["load_change"] for p in active]
        zones = [dict(key=k, label=l, count=sum(p["zone"] == k for p in active)) for k, l, _, _ in workload.ZONES]
        returns = [_rtp(p, rec) for p in payloads if (rec := recovery(p))["active"]]
        returns.sort(key=lambda r: r["days_left"] if r["days_left"] is not None else 999)
        players.sort(key=lambda p: (-sum(1 for f in p["flags"] if not f["reviewed"] and f["level"] == "danger"),
                                    -sum(1 for f in p["flags"] if not f["reviewed"]), p["name"]))
        return dict(reference_date=reference.isoformat(), team=dict(
            weekly_load_avg=round(sum(p["acute"] for p in active) / max(1, len(active))),
            acwr_avg=round(sum(ratios) / len(ratios), 2) if ratios else None,
            load_change=round(sum(changes) / max(1, len(changes)), 1), zones=zones,
            open_flags=sum(1 for p in players for f in p["flags"] if not f["reviewed"])),
            team_series=team_series, players=players, returns=returns)

    async def player(self, player_id: str) -> dict:
        entity = await self.session.get(Player, player_id)
        if entity is None or entity.payload["type_joueur"] != "DFCO":
            raise NotFoundError("Joueur introuvable", "Le suivi physique concerne l'effectif DFCO.", f"Unknown player {player_id}")
        p = entity.payload
        followups = list((await self.session.execute(select(PlayerFollowup).where(
            PlayerFollowup.player_id == player_id).order_by(PlayerFollowup.id))).scalars())
        reviews = list((await self.session.execute(select(LoadReview).where(
            LoadReview.player_id == player_id).order_by(LoadReview.id.desc()))).scalars())
        reference = date.fromisoformat(p["date_reference"])
        return dict(player=self._player_load(p, followups[-1] if followups else None, {r.flag for r in reviews}),
                    series=workload.rolling_series(simulation.sessions(p), reference), recovery=_rtp(p, recovery(p)),
                    wellness=[dict(date=f.payload["date"], author=f.payload["author"], fatigue=f.payload["fatigue"],
                                   soreness=f.payload["soreness"], rpe=f.payload["rpe"]) for f in followups],
                    reviews=[self._review(r) for r in reviews])

    @staticmethod
    def _review(r: LoadReview) -> dict:
        return dict(id=r.id, player_id=r.player_id, flag=r.flag, note=r.note or "", author=r.author,
                    date=(r.created_at.isoformat() if r.created_at else ""))

    async def add_review(self, payload: ReviewCreate) -> dict:
        entity = await self.session.get(Player, payload.player_id)
        if entity is None:
            raise NotFoundError("Joueur introuvable", "Ce joueur ne fait pas partie de l'effectif.", payload.player_id)
        review = LoadReview(player_id=payload.player_id, flag=payload.flag, note=payload.note.strip(), author=payload.author.strip())
        self.session.add(review)
        await self.session.commit()
        await self.session.refresh(review)
        return self._review(review)
