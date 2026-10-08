import json
import random
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.players.model import Player, PlayerFollowup
from app.features.players.schemas import FollowupCreate
from app.shared.exceptions import AppError

SEED_PATH = Path(__file__).resolve().parents[3] / "resources" / "players.json"
ATTRIBUTES = {
    "vitesse": ["acceleration", "vitesse_de_pointe"],
    "frappe": ["placement_offensif", "finition", "puissance_de_tir", "tir_de_loin", "volee", "penalty"],
    "passe": ["vista", "centre", "precision_coup_franc", "passe_courte", "passe_longue", "effet"],
    "dribble": ["agilite", "equilibre", "reactivite", "conduite_de_balle", "dribble", "calme"],
    "defense": ["interception", "precision_de_la_tete", "lucidite_defensive", "tacle_debout", "tacle_glisse"],
    "physique": ["detente", "endurance", "force", "agressivite"],
}
GK_ATTRIBUTES = ["gardien_plongeon", "gardien_prise_de_balle", "gardien_jeu_au_pied", "gardien_reflexes", "gardien_vitesse", "gardien_placement", "gardien_sorties"]


async def seed_players(session: AsyncSession) -> None:
    """Import the versioned demo snapshot, preserving existing player records."""
    existing = set((await session.execute(select(Player.id))).scalars())
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for payload in seed["players"]:
        if payload["joueur_id"] not in existing:
            session.add(Player(id=payload["joueur_id"], payload=payload))
    await session.commit()


class PlayerController:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get(self, player_id: str) -> Player:
        player = await self.session.get(Player, player_id)
        if player is None:
            raise AppError("Joueur introuvable", "Ce joueur ne fait pas partie de l’effectif.", f"Unknown player {player_id}")
        return player

    @staticmethod
    def _sessions(p: dict) -> list[dict]:
        """Fixtures only: GPS and sRPE are explicitly simulated, not FC27 data."""
        rng = random.Random("sessions:" + p["joueur_id"])
        reference = date.fromisoformat(p["date_reference"])
        sessions = []
        for offset in range(13, -1, -1):
            if offset in (2, 8):
                continue
            recovery = p["statut_sante"] in ("Blessé", "Réathlétisation")
            duration = rng.randint(20, 45) if recovery else rng.randint(45, 90)
            rpe = rng.randint(2, 4) if recovery else rng.randint(3, 8)
            distance = round(rng.uniform(.5, 2.5) if recovery else rng.uniform(3, 8.5), 1)
            sessions.append(dict(date=(reference - timedelta(days=offset)).isoformat(),
                label="Séance adaptée" if recovery else "Entraînement collectif", duration=duration,
                rpe=rpe, load=duration * rpe, distance_km=distance,
                high_speed_m=0 if recovery else rng.randint(120, 850),
                sprints=0 if recovery else rng.randint(5, 26),
                max_speed=round(rng.uniform(12, 18) if recovery else rng.uniform(24, 33), 1), simulated=True))
        return sessions

    @staticmethod
    def _matches(p: dict) -> list[dict]:
        rng = random.Random("matches:" + p["joueur_id"])
        reference = date.fromisoformat(p["date_reference"])
        return [dict(date=(reference - timedelta(days=18 + i * 7)).isoformat(),
            opponent=f"Opposition de simulation {i + 1:02d}", minutes=rng.choice([45, 60, 75, 90]),
            goals=0 if p["gardien"] else rng.choices([0, 1, 2], [7, 2, 1])[0],
            assists=0 if p["gardien"] else rng.choices([0, 1], [8, 2])[0],
            pass_accuracy=rng.randint(65, 94), duels_won=rng.randint(2, 12), simulated=True) for i in range(4)]

    @staticmethod
    def _summary(p: dict, latest: PlayerFollowup | None = None) -> dict:
        sessions = PlayerController._sessions(p)
        reference = date.fromisoformat(p["date_reference"])
        current = sum(s["load"] for s in sessions if (reference - date.fromisoformat(s["date"])).days < 7)
        previous = sum(s["load"] for s in sessions if (reference - date.fromisoformat(s["date"])).days >= 7)
        change = round((current - previous) / previous * 100, 1) if previous else 0
        fatigue = latest.payload["fatigue"] if latest else p["fatigue_score"]
        alerts = []
        status = p["statut_sante"]
        if status in ("Blessé", "Réathlétisation"):
            alerts.append(dict(level="danger" if status == "Blessé" else "warn", title="Retour à suivre",
                description=f"{p['disponibilite']}. Retour prévu : {p['retour_prevu'] or 'non renseigné'}.",
                action="Voir le parcours de retour", section="physical"))
        if status == "Vigilance" or fatigue >= 60:
            alerts.append(dict(level="warn", title="Récupération à examiner",
                description=f"Fatigue déclarée : {fatigue}/100. Faire le point avec le joueur.",
                action="Consulter le suivi", section="history"))
        if latest and latest.payload["soreness"] >= 4:
            alerts.append(dict(level="warn", title="Gêne signalée par le joueur",
                description=f"Dernier bilan : gêne {latest.payload['soreness']}/10. À examiner par le staff.",
                action="Lire le dernier bilan", section="history"))
        if change > 20:
            alerts.append(dict(level="warn", title="Hausse de charge sur 7 jours",
                description=f"+{change:.0f} % par rapport aux 7 jours précédents. Revoir la répartition des séances.",
                action="Examiner la charge", section="physical"))
        if p["satisfaction_score"] < 45:
            alerts.append(dict(level="info", title="Un échange à prévoir",
                description=p["satisfaction_motif"], action="Voir le ressenti", section="history"))
        return dict(id=p["joueur_id"], name=p["nom"], role=p["groupe_poste"],
            position=p.get("poste_fc27") or p["groupe_poste"], goalkeeper=p["gardien"],
            age=p["age"], height=p["taille_cm"], weight=p["poids_kg"], foot=p["pied_fort"],
            overall=p.get("note_generale_fc27"), ratings={g: p["note_" + g] for g in ATTRIBUTES},
            status=status, availability=p["disponibilite"], health=p["sante_score"], fatigue=fatigue,
            satisfaction=p["satisfaction_score"], return_date=p["retour_prevu"],
            fc27=p.get("statut_import_fc27") == "IMPORTE", fc27_url=p.get("fc27_url"),
            alerts=alerts, weekly_load=current, load_change=change)

    async def list_players(self) -> list[dict]:
        players = list((await self.session.execute(select(Player).order_by(Player.id))).scalars())
        followups = list((await self.session.execute(select(PlayerFollowup).order_by(PlayerFollowup.id))).scalars())
        latest = {f.player_id: f for f in followups}
        return [self._summary(p.payload, latest.get(p.id)) for p in players]

    async def detail(self, player_id: str) -> dict:
        entity = await self._get(player_id)
        p = entity.payload
        followups = list((await self.session.execute(select(PlayerFollowup).where(
            PlayerFollowup.player_id == player_id).order_by(PlayerFollowup.id.desc()))).scalars())
        injuries = p["injuries"]
        active = next((b for b in injuries if b["statut"] != "Terminée"), None)
        progress, step = 0, 0
        if active:
            start = date.fromisoformat(active["debut"])
            end = date.fromisoformat(active["retour_prevu"])
            reference = date.fromisoformat(p["date_reference"])
            progress = min(95, max(0, round((reference - start).days / max(1, (end - start).days) * 100)))
            step = 2 if p["statut_sante"] == "Réathlétisation" else 1 if progress >= 25 else 0
        steps = ["Récupération", "Travail individuel", "Reprise adaptée", "Retour à valider"]
        return dict(player=self._summary(p, followups[0] if followups else None), reference_date=p["date_reference"],
            attributes={a: p.get(a) for group in ATTRIBUTES.values() for a in group} | {a: p.get(a) for a in GK_ATTRIBUTES},
            tags=p["personnalite_tags"], specialties=p["specialite_tags"],
            playstyles=p.get("playstyles_fc27_observes", []), languages=p["langues_parlees"],
            team_relation=p["relation_equipe_general"], satisfaction_reason=p["satisfaction_motif"],
            injuries=sorted(injuries, key=lambda b: b["debut"], reverse=True), relations=p["relations"],
            sessions=self._sessions(p), matches=self._matches(p),
            followups=[dict(id=f.id, **f.payload) for f in followups],
            recovery=dict(active=bool(active), progress=progress, phase=steps[step] if active else "Disponible",
                steps=steps, current_step=step, return_date=p["retour_prevu"]))

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
