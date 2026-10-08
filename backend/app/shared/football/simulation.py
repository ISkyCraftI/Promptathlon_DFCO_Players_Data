"""Données de démonstration déterministes : séances GPS / sRPE et matchs.

Aucun capteur ni fournisseur de match n'est branché. Chaque série est générée à partir de
l'identifiant du joueur (graine stable) pour rester identique d'un démarrage à l'autre.
"""
import random
from datetime import date, timedelta

HISTORY_DAYS = 42
REST_DAYS = (2, 6)  # offset % 7 -> pas de séance
MATCH_COUNT = 6
OPPONENT_SLOTS = ["Domicile", "Extérieur"]


def _active_injury(p: dict) -> dict | None:
    return next((b for b in p.get("injuries", []) if b["statut"] != "Terminée"), None)


def _pattern(p: dict, rng: random.Random) -> str:
    if p["statut_sante"] == "Vigilance":
        return rng.choices(["spike", "stable"], [6, 4])[0]
    return rng.choices(["stable", "spike", "underload"], [70, 15, 15])[0]


def sessions(p: dict, days: int = HISTORY_DAYS) -> list[dict]:
    """Séances des `days` derniers jours (charge = durée × RPE, en UA)."""
    rng = random.Random("sessions:v2:" + p["joueur_id"])
    reference = date.fromisoformat(p["date_reference"])
    injury = _active_injury(p)
    injury_start = date.fromisoformat(injury["debut"]) if injury else None
    status = p["statut_sante"]
    pattern = _pattern(p, rng)
    spike = rng.uniform(1.55, 2.0)
    out = []
    for offset in range(HISTORY_DAYS - 1, -1, -1):
        day = reference - timedelta(days=offset)
        duration, rpe = rng.randint(60, 90), rng.randint(4, 8)
        distance, high_speed = rng.uniform(4.5, 8.5), rng.randint(250, 850)
        sprints, max_speed = rng.randint(8, 26), rng.uniform(27, 33)
        if offset % 7 in REST_DAYS or offset >= days:
            continue
        label, kind = "Entraînement collectif", "collectif"
        factor = 1.0
        if injury_start and day >= injury_start:
            since = (day - injury_start).days
            span = max(1, (reference - injury_start).days)
            if status == "Réathlétisation":
                factor = 0.25 + 0.6 * since / span
                label, kind = "Réathlétisation", "reathletisation"
            else:
                factor = 0.18
                label, kind = "Soins et récupération", "soins"
        elif offset < 7 and pattern == "spike":
            factor = spike
        elif offset < 7 and pattern == "underload":
            factor = 0.6
        if kind != "collectif" or factor != 1.0:
            duration = max(20, round(duration * min(1.4, factor + 0.25)))
            rpe = max(1, min(10, round(rpe * min(1.4, max(0.35, factor)))))
        session_distance = round(distance * factor, 1)
        out.append(dict(date=day.isoformat(), label=label, kind=kind, duration=duration, rpe=rpe, load=duration * rpe,
                        distance_km=session_distance, high_speed_m=round(high_speed * factor) if factor > 0.3 else 0,
                        sprints=round(sprints * factor) if factor > 0.3 else 0,
                        max_speed=round(max_speed * (0.55 + 0.45 * min(1.0, factor)), 1), simulated=True))
    return out


def matches(p: dict) -> list[dict]:
    """Six derniers matchs de championnat (du plus récent au plus ancien)."""
    rng = random.Random("matches:v2:" + p["joueur_id"])
    reference = date.fromisoformat(p["date_reference"])
    injury = _active_injury(p)
    injury_start = date.fromisoformat(injury["debut"]) if injury else None
    out = []
    for i in range(MATCH_COUNT):
        day = reference - timedelta(days=4 + 7 * i)
        minutes = rng.choice([0, 25, 45, 64, 78, 90, 90, 90])
        if injury_start and day >= injury_start:
            minutes = 0
        played = minutes > 0
        goals = 0 if p["gardien"] or not played else rng.choices([0, 1, 2], [7, 2, 1])[0]
        assists = 0 if p["gardien"] or not played else rng.choices([0, 1], [8, 2])[0]
        rating = round(min(9.5, rng.uniform(5.8, 7.6) + 0.5 * goals + 0.3 * assists), 1) if played else None
        out.append(dict(date=day.isoformat(), matchday=10 - i, venue=OPPONENT_SLOTS[i % 2],
                        opponent=f"Adversaire simulé · J{10 - i}", minutes=minutes, goals=goals, assists=assists,
                        pass_accuracy=rng.randint(65, 94) if played else 0, duels_won=rng.randint(2, 12) if played else 0,
                        distance_km=round(minutes / 90 * rng.uniform(9.2, 11.8), 1), rating=rating, simulated=True))
    return out
