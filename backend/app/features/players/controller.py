import json
from datetime import date, datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.players.model import Player, PlayerFollowup
from app.features.players.schemas import FollowupCreate
from app.shared.exceptions import AppError, NotFoundError
from app.shared.football import simulation, workload
from app.shared.football.valuation import market_value
from app.shared.football.catalog import ATTRIBUTES, GK_ATTRIBUTES

SEED_PATH = Path(__file__).resolve().parents[3] / "resources" / "players.json"
DETAIL_DAYS = 14
RECOVERY_STEPS = ["Soins", "Travail individuel", "Reprise adaptée", "Retour à valider"]
ALERT_RANK = {"danger": 0, "warn": 1, "info": 2}


def _fr_date(value: str | None) -> str:
    return date.fromisoformat(value).strftime("%d/%m/%Y") if value else "non renseigné"


async def seed_players(session: AsyncSession) -> None:
    """Import the versioned demo snapshot (squad + prospects), preserving existing player records."""
    existing = set((await session.execute(select(Player.id))).scalars())
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for payload in seed["players"]:
        if payload["joueur_id"] not in existing:
            session.add(Player(id=payload["joueur_id"], payload=payload))
    await session.commit()


async def load_payloads(session: AsyncSession, kind: str | None = "DFCO") -> list[dict]:
    """Raw player payloads, shared with the other features. kind: "DFCO", "PROSPECT" or None (all)."""
    players = (await session.execute(select(Player).order_by(Player.id))).scalars()
    return [p.payload for p in players if kind is None or p.payload.get("type_joueur") == kind]


async def latest_followups(session: AsyncSession) -> dict[str, PlayerFollowup]:
    rows = (await session.execute(select(PlayerFollowup).order_by(PlayerFollowup.id))).scalars()
    return {f.player_id: f for f in rows}


def recovery(p: dict) -> dict:
    """Return-to-play path, estimated from the scenario dates (not a medical validation)."""
    active = next((b for b in p.get("injuries", []) if b["statut"] != "Terminée"), None)
    if not active:
        return dict(active=False, progress=100, phase="Disponible", steps=RECOVERY_STEPS, current_step=len(RECOVERY_STEPS),
                    return_date=None, days_left=None, injury=None)
    start, end = date.fromisoformat(active["debut"]), date.fromisoformat(active["retour_prevu"])
    reference = date.fromisoformat(p["date_reference"])
    progress = min(95, max(0, round((reference - start).days / max(1, (end - start).days) * 100)))
    step = 2 if p["statut_sante"] == "Réathlétisation" else 1 if progress >= 25 else 0
    if progress >= 85:
        step = 3
    return dict(active=True, progress=progress, phase=RECOVERY_STEPS[step], steps=RECOVERY_STEPS, current_step=step,
                return_date=active["retour_prevu"], days_left=max(0, (end - reference).days),
                injury=f"{active['type_blessure']} · {active['zone']}")


def summary(p: dict, latest: PlayerFollowup | None = None) -> dict:
    reference = date.fromisoformat(p["date_reference"])
    sessions = simulation.sessions(p)
    acute, chronic, acwr = workload.acute_chronic(sessions, reference)
    previous = sum(s["load"] for s in sessions if 7 <= (reference - date.fromisoformat(s["date"])).days < 14)
    change = round((acute - previous) / previous * 100, 1) if previous else 0
    fatigue = latest.payload["fatigue"] if latest else p["fatigue_score"]
    zone = workload.zone(acwr) if p["statut_sante"] not in ("Blessé", "Réathlétisation") else workload.RETURN_ZONE
    alerts = []
    status = p["statut_sante"]
    if status in ("Blessé", "Réathlétisation"):
        alerts.append(dict(level="danger" if status == "Blessé" else "warn", title="Retour à suivre",
            description=f"{p['disponibilite']}. Retour prévu : {_fr_date(p['retour_prevu'])}.",
            action="Voir le parcours de retour", section="physical"))
    if status == "Vigilance" or fatigue >= 60:
        alerts.append(dict(level="warn", title="Récupération à examiner",
            description=f"Fatigue déclarée : {fatigue}/100. Faire le point avec le joueur.",
            action="Consulter le suivi", section="history"))
    if latest and latest.payload["soreness"] >= 4:
        alerts.append(dict(level="warn", title="Gêne signalée par le joueur",
            description=f"Dernier bilan : gêne {latest.payload['soreness']}/10. À examiner par le staff.",
            action="Lire le dernier bilan", section="history"))
    if status not in ("Blessé", "Réathlétisation") and zone["key"] in ("vigilance", "risque"):
        alerts.append(dict(level="danger" if zone["key"] == "risque" else "warn", title="Charge aiguë élevée",
            description=f"Ratio aigu/chronique de {workload.fr_ratio(acwr)} ({zone['label'].lower()}). Revoir la répartition des séances.",
            action="Examiner la charge", section="physical"))
    if p["satisfaction_score"] < 45:
        alerts.append(dict(level="info", title="Un échange à prévoir",
            description=p["satisfaction_motif"], action="Voir le ressenti", section="history"))
    alerts.sort(key=lambda a: ALERT_RANK[a["level"]])
    return dict(id=p["joueur_id"], name=p["nom"], kind=p["type_joueur"], club=p.get("club"), role=p["groupe_poste"],
        position=p.get("poste_fc27") or p["groupe_poste"], goalkeeper=p["gardien"],
        age=p["age"], height=p["taille_cm"], weight=p["poids_kg"], foot=p["pied_fort"],
        overall=p.get("note_generale_fc27"), ratings={g: p["note_" + g] for g in ATTRIBUTES},
        status=status, availability=p["disponibilite"], health=p["sante_score"], fatigue=fatigue,
        satisfaction=p["satisfaction_score"], return_date=p["retour_prevu"],
        fc27=p.get("statut_import_fc27") == "IMPORTE", fc27_url=p.get("fc27_url"),
        alerts=alerts, weekly_load=acute, load_change=change, acwr=acwr, load_zone=zone["key"],
        market_value=market_value(p))


class PlayerController:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get(self, player_id: str) -> Player:
        player = await self.session.get(Player, player_id)
        if player is None:
            raise NotFoundError("Joueur introuvable", "Ce joueur ne fait pas partie de la base.", f"Unknown player {player_id}")
        return player

    async def list_players(self, kind: str | None = "DFCO") -> list[dict]:
        latest = await latest_followups(self.session)
        return [summary(p, latest.get(p["joueur_id"])) for p in await load_payloads(self.session, kind)]

    async def detail(self, player_id: str) -> dict:
        entity = await self._get(player_id)
        p = entity.payload
        followups = list((await self.session.execute(select(PlayerFollowup).where(
            PlayerFollowup.player_id == player_id).order_by(PlayerFollowup.id.desc()))).scalars())
        return dict(player=summary(p, followups[0] if followups else None), reference_date=p["date_reference"],
            attributes={a: p.get(a) for group in ATTRIBUTES.values() for a in group} | {a: p.get(a) for a in GK_ATTRIBUTES},
            tags=p["personnalite_tags"], specialties=p["specialite_tags"],
            playstyles=p.get("playstyles_fc27_observes", []), languages=p["langues_parlees"],
            team_relation=p["relation_equipe_general"], satisfaction_reason=p["satisfaction_motif"],
            injuries=sorted(p["injuries"], key=lambda b: b["debut"], reverse=True), relations=p["relations"],
            sessions=simulation.sessions(p, DETAIL_DAYS), matches=simulation.matches(p),
            followups=[dict(id=f.id, **f.payload) for f in followups], recovery=recovery(p))

    async def add_followup(self, player_id: str, payload: FollowupCreate) -> dict:
        await self._get(player_id)
        values = payload.model_dump()
        values["note"] = values["note"].strip()
        if len(values["note"]) < 3:
            raise AppError("Observation trop courte", "Ajoutez au moins trois caractères à votre observation.")
        values["date"] = datetime.now(timezone.utc).isoformat()
        entry = PlayerFollowup(player_id=player_id, payload=values)
        self.session.add(entry)
        await self.session.commit()
        await self.session.refresh(entry)
        return dict(id=entry.id, **values)
