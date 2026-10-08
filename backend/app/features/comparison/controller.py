from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.players.controller import load_payloads
from app.shared.exceptions import AppError, NotFoundError
from app.shared.football import simulation, workload
from app.shared.football.catalog import ATTRIBUTES, GOALKEEPING, GROUPS, YOUNG_MAX_AGE
from app.shared.football.scoring import gaps, similarity
from app.shared.football.valuation import market_value

ADVICE = {
    "vitesse": "Vitesse et appuis : sprints courts, départs arrêtés, changements de direction.",
    "frappe": "Finition : répétitions devant le but sous contrainte de temps et d'opposition.",
    "passe": "Jeu de passe : jeu à une touche, rondos sous pression, alternance court / long.",
    "dribble": "Conduite et 1 contre 1 en espace réduit, prise d'information avant la réception.",
    "defense": "Duels et lecture du jeu : jeux réduits à thème défensif, séquences vidéo.",
    "physique": "Programme individualisé avec la préparation physique (force, endurance).",
    "gardien": "Spécifique gardien : réflexes, placement sur centres, jeu au pied sous pression.",
}

# Trois lectures : un jeune face au reste du groupe, deux joueurs du groupe, un prospect face au groupe.
MODES = ("young", "squad", "prospect")


def _is_young(p: dict) -> bool:
    return p["type_joueur"] == "DFCO" and p["age"] <= YOUNG_MAX_AGE


def _subjects(everyone: list[dict], mode: str) -> list[dict]:
    if mode == "young":
        return [p for p in everyone if _is_young(p)]
    if mode == "prospect":
        return [p for p in everyone if p["type_joueur"] == "PROSPECT"]
    return [p for p in everyone if p["type_joueur"] == "DFCO"]


def _references(everyone: list[dict], mode: str) -> list[dict]:
    """Toujours le collectif DFCO ; en mode jeunes, le « reste du collectif » (plus de 21 ans)."""
    squad = [p for p in everyone if p["type_joueur"] == "DFCO"]
    return [p for p in squad if not _is_young(p)] if mode == "young" else squad


def lite(p: dict) -> dict:
    return dict(id=p["joueur_id"], name=p["nom"], kind=p["type_joueur"], age=p["age"], role=p["groupe_poste"],
                position=p.get("poste_fc27") or p["groupe_poste"], overall=p.get("note_generale_fc27"),
                goalkeeper=p["gardien"], ratings={g: p["note_" + g] for g in ATTRIBUTES}, market_value=market_value(p))


def physical(p: dict) -> dict:
    reference = date.fromisoformat(p["date_reference"])
    sessions = simulation.sessions(p, 14)
    acute, _, _ = workload.acute_chronic(simulation.sessions(p), reference)
    return dict(weekly_load=acute, distance_km=round(sum(s["distance_km"] for s in sessions) / max(1, len(sessions)), 1),
                sprints=round(sum(s["sprints"] for s in sessions) / max(1, len(sessions))),
                max_speed=max((s["max_speed"] for s in sessions), default=0),
                minutes=sum(m["minutes"] for m in simulation.matches(p)))


def _auto_reference(subject: dict, pool: list[dict], mode: str) -> dict | None:
    same_role = [p for p in pool if p["groupe_poste"] == subject["groupe_poste"] and p["joueur_id"] != subject["joueur_id"]]
    if not same_role:
        return None
    # Même poste FC (ex. LB) privilégié, puis style le plus proche.
    same_spot = lambda p: 5 if p.get("poste_fc27") and p.get("poste_fc27") == subject.get("poste_fc27") else 0
    if mode == "prospect":
        # Le joueur du groupe qu'il concurrencerait : même poste, style le plus proche.
        return max(same_role, key=lambda p: similarity(subject, p) + same_spot(p))
    # Jeune ou joueur du groupe : la référence à atteindre (note au moins égale).
    level = subject.get("note_generale_fc27") or 0
    better = [p for p in same_role if (p.get("note_generale_fc27") or 0) >= level] or same_role
    return max(better, key=lambda p: similarity(subject, p) + same_spot(p))


class ComparisonController:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def candidates(self, mode: str = "young") -> dict:
        everyone = await load_payloads(self.session, None)
        subjects = sorted((lite(p) for p in _subjects(everyone, mode)), key=lambda p: (p["role"], -(p["overall"] or 0)))
        references = sorted((lite(p) for p in _references(everyone, mode)), key=lambda p: (p["role"], -(p["overall"] or 0)))
        return dict(mode=mode, subjects=subjects, references=references, young_max_age=YOUNG_MAX_AGE)

    async def compare(self, subject_id: str, reference_id: str | None, mode: str = "young") -> dict:
        everyone = await load_payloads(self.session, None)
        by_id = {p["joueur_id"]: p for p in everyone}
        subject = by_id.get(subject_id)
        if subject is None:
            raise NotFoundError("Joueur introuvable", "Le joueur sélectionné n'existe pas.", f"Unknown player {subject_id}")
        auto = reference_id is None
        if auto:
            reference = _auto_reference(subject, _references(everyone, mode), mode)
            if reference is None:
                raise AppError("Aucune référence", "Aucun joueur du collectif au même poste n'est disponible pour comparer.")
        else:
            reference = by_id.get(reference_id)
            if reference is None:
                raise NotFoundError("Joueur introuvable", "Le joueur de référence n'existe pas.", f"Unknown player {reference_id}")
            if reference["joueur_id"] == subject_id:
                raise AppError("Même joueur", "Choisissez deux joueurs différents.")
            if reference["groupe_poste"] != subject["groupe_poste"]:
                raise AppError("Postes différents",
                               f"Comparez deux joueurs du même poste : {subject['groupe_poste']} et {reference['groupe_poste']}.")
        role = subject["groupe_poste"]
        attributes = sorted(gaps(subject, reference, role), key=lambda a: a["impact"], reverse=True)
        axes = [dict(key=a["key"], label=a["label"], group=a["group"], gap=a["gap"], subject=a["subject"],
                     reference=a["reference"], advice=ADVICE[a["group"]])
                for a in attributes if a["gap"] > 0 and a["importance"] > 0][:3]
        strengths = sorted([a for a in attributes if a["gap"] <= 0 and a["importance"] > 0], key=lambda a: a["gap"])[:3]
        if subject["gardien"]:
            group_keys = [("gardien", "Gardien", list(GOALKEEPING))]
        else:
            group_keys = [(k, g["label"], list(g["attributes"])) for k, g in GROUPS.items()]
        groups = []
        for key, label, attrs in group_keys:
            s = [a["subject"] for a in attributes if a["key"] in attrs]
            r = [a["reference"] for a in attributes if a["key"] in attrs]
            if s:
                groups.append(dict(key=key, label=label, subject=round(sum(s) / len(s), 1),
                                   reference=round(sum(r) / len(r), 1), gap=round((sum(r) - sum(s)) / len(s), 1)))
        overall_subject, overall_ref = subject.get("note_generale_fc27"), reference.get("note_generale_fc27")
        subject_lite, reference_lite = lite(subject), lite(reference)
        return dict(mode=mode, subject=subject_lite, reference=reference_lite, reference_auto=auto,
                    similarity=similarity(subject, reference),
                    overall_gap=(overall_ref - overall_subject) if overall_subject and overall_ref else None,
                    value_gap=reference_lite["market_value"] - subject_lite["market_value"],
                    groups=groups, attributes=attributes, axes=axes, strengths=strengths,
                    physical=dict(subject=physical(subject), reference=physical(reference)))
