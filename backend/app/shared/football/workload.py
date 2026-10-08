"""Indicateurs de charge : aiguë (7 j), chronique (moyenne hebdo sur 28 j) et ratio ACWR.

Les seuils sont des repères de lecture usuels en préparation physique (zone 0,8 – 1,3),
pas un diagnostic : ils signalent une situation à examiner par le staff.
"""
from datetime import date, timedelta

# Joueur blessé ou en réathlétisation : le ratio ne s'interprète pas, la charge suit le protocole de retour.
RETURN_ZONE = dict(key="retour", label="Protocole de retour")

ZONES = [
    ("sous-charge", "Sous-charge", 0.0, 0.8),
    ("optimale", "Zone optimale", 0.8, 1.3),
    ("vigilance", "Vigilance", 1.3, 1.5),
    ("risque", "Surcharge", 1.5, 99.0),
]


def daily_loads(sessions: list[dict], reference: date, days: int = 28) -> list[dict]:
    by_day = {s["date"]: s["load"] for s in sessions}
    return [dict(date=(d := reference - timedelta(days=o)).isoformat(), load=by_day.get(d.isoformat(), 0))
            for o in range(days - 1, -1, -1)]


def acute_chronic(sessions: list[dict], reference: date) -> tuple[int, float, float | None]:
    acute = sum(s["load"] for s in sessions if 0 <= (reference - date.fromisoformat(s["date"])).days < 7)
    chronic = sum(s["load"] for s in sessions if 0 <= (reference - date.fromisoformat(s["date"])).days < 28) / 4
    return acute, round(chronic, 1), (round(acute / chronic, 2) if chronic else None)


def fr_ratio(value: float | None) -> str:
    """Ratio au format français (1,65) pour les textes destinés au staff."""
    return "—" if value is None else f"{value:.2f}".replace(".", ",")


def zone(acwr: float | None) -> dict:
    if acwr is None:
        return dict(key="inconnue", label="Données insuffisantes")
    for key, label, low, high in ZONES:
        if low <= acwr < high:
            return dict(key=key, label=label)
    return dict(key="risque", label="Surcharge")


def rolling_series(sessions: list[dict], reference: date, days: int = 21, history: int = 42) -> list[dict]:
    """Série quotidienne : charge du jour, cumul 7 j glissant et ratio vs moyenne hebdo (fenêtre ≤ 28 j)."""
    loads = {d["date"]: d["load"] for d in daily_loads(sessions, reference, history)}
    keys = sorted(loads)
    out = []
    for i, key in enumerate(keys[-days:], start=len(keys) - days):
        acute = sum(loads[k] for k in keys[max(0, i - 6): i + 1])
        window = keys[max(0, i - 27): i + 1]
        chronic = sum(loads[k] for k in window) / (len(window) / 7) if len(window) >= 21 else None
        out.append(dict(date=key, load=loads[key], acute=acute, chronic=round(chronic, 1) if chronic else None,
                        acwr=round(acute / chronic, 2) if chronic else None))
    return out
