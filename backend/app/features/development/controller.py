import json
from pathlib import Path
from statistics import mean
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.development.model import DevelopmentPlayer
from app.features.development.schemas import CompareRequest, ProfileCreate, FIELD_KEYS, KEEPER_KEYS
from app.features.players.model import Player
from app.shared.exceptions import AppError

SEED_PATH = Path(__file__).resolve().parents[3] / "resources" / "development.json"
POSITIONS = {"GK": "Gardien", "CB": "Défenseur", "LB": "Défenseur", "RB": "Défenseur",
    "CDM": "Milieu", "CM": "Milieu", "CAM": "Milieu", "LM": "Milieu", "RM": "Milieu",
    "LW": "Attaquant", "RW": "Attaquant", "ST": "Attaquant"}
DEFAULT_POSITION = {"Gardien": "GK", "Défenseur": "CB", "Milieu": "CM", "Attaquant": "ST"}
LABELS = {"vitesse": "Vitesse", "frappe": "Frappe", "passe": "Passe", "dribble": "Dribble",
    "defense": "Défense", "physique": "Physique", "plongeon": "Plongeon", "prise": "Prise de balle",
    "jeu_pied": "Jeu au pied", "reflexes": "Réflexes", "placement": "Placement"}
ACTIONS = {"vitesse": "Observer les premiers appuis et la répétition des accélérations sur le terrain.",
    "frappe": "Travailler la finition sous pression et suivre la précision sur plusieurs séances.",
    "passe": "Observer les choix et la précision des passes sous pression, puis travailler les situations ciblées.",
    "dribble": "Travailler le premier contrôle, la conduite et les un-contre-un en situation de match.",
    "defense": "Revoir le placement et les duels à la vidéo, puis pratiquer en opposition.",
    "physique": "Faire le point avec le préparateur sur les exigences du poste et le programme adapté.",
    "plongeon": "Observer les appuis et la technique de plongeon avec l'entraîneur des gardiens.",
    "prise": "Travailler la sécurité des prises de balle sur trajectoires variées.",
    "jeu_pied": "Travailler la relance courte et longue face à un pressing.",
    "reflexes": "Observer les réactions sur tirs rapprochés et secondes balles.",
    "placement": "Analyser le positionnement par rapport au ballon et aux défenseurs à la vidéo."}
# Importance relative des qualités selon la famille de poste ; ne prédit pas une carrière.
WEIGHTS = {"Gardien": [1.2, 1.2, 1, 1.4, .6, 1.6], "Défenseur": [1, .4, 1, .6, 1.8, 1.4],
    "Milieu": [.8, .8, 1.7, 1.4, .8, 1], "Attaquant": [1.3, 1.8, .8, 1.4, .3, 1]}


async def seed_development(session: AsyncSession):
    existing = set((await session.execute(select(DevelopmentPlayer.id))).scalars())
    for payload in json.loads(SEED_PATH.read_text(encoding="utf-8"))["players"]:
        if payload["id"] not in existing:
            session.add(DevelopmentPlayer(id=payload["id"], payload=payload))
    await session.commit()


class DevelopmentController:
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _public(payload: dict, editable=True):
        payload = {**payload, "foot": "Les deux" if payload["foot"] == "Ambidextre" else payload["foot"]}
        return dict(**payload, editable=editable,
            coverage=sum(value is not None for value in payload["ratings"].values()))

    @staticmethod
    def _professional(p: dict):
        position = p.get("poste_fc27") or DEFAULT_POSITION[p["groupe_poste"]]
        role = POSITIONS.get(position, p["groupe_poste"])
        keys = KEEPER_KEYS if p["gardien"] else FIELD_KEYS
        keeper = ["gardien_plongeon", "gardien_prise_de_balle", "gardien_jeu_au_pied", "gardien_reflexes", "gardien_vitesse", "gardien_placement"]
        ratings = {key: p.get(keeper[i]) if p["gardien"] else p.get("note_" + key) for i, key in enumerate(keys)}
        return dict(id=p["joueur_id"], name=p["nom"], category="pro", age=p["age"], position=position,
            role=role, foot=p["pied_fort"], height=p["taille_cm"], weight=p["poids_kg"], ratings=ratings,
            observations=0, minutes=None, assessed_on=p["date_reference"], note="Profil de référence du collectif.", demo=True)

    async def profiles(self):
        pros = list((await self.session.execute(select(Player).order_by(Player.id))).scalars())
        others = list((await self.session.execute(select(DevelopmentPlayer).order_by(DevelopmentPlayer.id))).scalars())
        return [self._public(self._professional(p.payload), False) for p in pros] + [self._public(p.payload) for p in others]

    async def save(self, values: ProfileCreate, profile_id: str | None = None):
        entity = await self.session.get(DevelopmentPlayer, profile_id) if profile_id else None
        if profile_id and entity is None:
            raise AppError("Profil introuvable", "Ce profil ne peut pas être modifié dans cet espace.")
        payload = values.model_dump(mode="json")
        payload.update(id=profile_id or "DEV_" + uuid4().hex[:16], role=POSITIONS[values.position], demo=entity.payload["demo"] if entity else False)
        if entity:
            entity.payload = payload
        else:
            entity = DevelopmentPlayer(id=payload["id"], payload=payload)
            self.session.add(entity)
        await self.session.commit()
        return self._public(payload)

    @staticmethod
    def compare_profiles(profiles: list[dict], request: CompareRequest):
        target = next((p for p in profiles if p["id"] == request.target_id), None)
        if target is None:
            raise AppError("Profil introuvable", "Sélectionnez un joueur présent dans la liste.")
        if request.same_foot and target["foot"] is None:
            raise AppError("Pied fort manquant", "Renseignez le pied fort ou désactivez ce critère.")
        eligible = [p for p in profiles if p["id"] != target["id"] and p["category"] == request.reference_category
            and p["role"] == target["role"] and (p["position"] == "GK") == (target["position"] == "GK")
            and (not request.strict_position or p["position"] == target["position"])
            and (not request.same_foot or p["foot"] == target["foot"])
            and (request.min_age is None or p["age"] >= request.min_age)
            and (request.max_age is None or p["age"] <= request.max_age)]
        keys = KEEPER_KEYS if target["position"] == "GK" else FIELD_KEYS

        def proximity(p):
            pairs = [(target["ratings"].get(k), p["ratings"].get(k)) for k in keys]
            common = [(a, b) for a, b in pairs if a is not None and b is not None]
            return (p["position"] != target["position"], -len(common),
                mean(abs(a - b) for a, b in common) if common else 100, p["name"])

        eligible.sort(key=proximity)
        if request.reference_ids is not None:
            by_id = {p["id"]: p for p in eligible}
            if any(i not in by_id for i in request.reference_ids):
                raise AppError("Référence incompatible", "Choisissez des références correspondant aux filtres et au poste du joueur.")
            references = [by_id[i] for i in request.reference_ids]
        else:
            references = [p for p in eligible if any(p["ratings"].get(k) is not None for k in keys)][:5]
        metrics = []
        for key, weight in zip(keys, WEIGHTS[target["role"]]):
            values = [p["ratings"].get(key) for p in references if p["ratings"].get(key) is not None]
            benchmark = round(mean(values), 1) if values else None
            value = target["ratings"].get(key)
            metrics.append(dict(key=key, label=LABELS[key], value=value, benchmark=benchmark,
                delta=round(value - benchmark, 1) if value is not None and benchmark is not None else None,
                weight=weight, reference_count=len(values), action=ACTIONS[key]))
        comparable = [m for m in metrics if m["delta"] is not None]
        missing = [m["label"] for m in metrics if m["value"] is None]
        # At least four comparable dimensions; missing scores are never converted to zero.
        reference_score = sum(m["benchmark"] * m["weight"] for m in comparable)
        relative = round(sum(m["value"] * m["weight"] for m in comparable) / reference_score * 100, 1) if len(comparable) >= 4 and reference_score > 0 else None
        if not references:
            verdict, explanation = "Aucune référence adaptée", "Élargissez les critères ou ajoutez des profils au même poste."
        elif len(comparable) >= 4 and reference_score <= 0:
            verdict, explanation = "Références à revoir", "La moyenne des références est nulle. Un niveau relatif ne peut pas être calculé ; vérifiez les observations."
        elif relative is None:
            verdict, explanation = "Données à compléter", "Il faut au moins quatre qualités comparables pour situer le niveau actuel."
        elif relative >= 95:
            verdict, explanation = "Des points d’appui solides", "Les qualités renseignées sont proches ou au-dessus du groupe de référence. À confirmer en opposition."
        elif relative >= 80:
            verdict, explanation = "Une progression à construire", "Plusieurs qualités se rapprochent des références ; concentrez le suivi sur les écarts prioritaires."
        else:
            verdict, explanation = "Des écarts importants à travailler", "Le niveau renseigné reste éloigné des références. Définissez un programme puis réévaluez, sans conclure à une absence de potentiel."
        priorities = sorted([m for m in comparable if m["delta"] < 0], key=lambda m: m["delta"] * m["weight"])[:3]
        strengths = sorted(comparable, key=lambda m: m["delta"], reverse=True)[:2]
        demo = target["demo"] or any(p["demo"] for p in references)
        confidence = "Démonstration" if demo else "À confirmer" if target["observations"] < 3 or len(references) < 3 or missing else "Observations disponibles"
        steps = (["Compléter : " + ", ".join(missing) + "."] if missing else [])
        if not references:
            steps.append("Élargir les filtres ou ajouter des références compatibles.")
        if target["observations"] < 3:
            steps.append("Observer le joueur sur au moins trois séances ou matchs avant de confirmer les pistes.")
        steps += [m["action"] for m in priorities]
        steps.append("Réévaluer après un cycle de travail avec les mêmes critères et conserver les observations du staff.")
        return dict(target=target, references=references, eligible=eligible, metrics=metrics, priorities=priorities,
            strengths=strengths, missing=missing, relative_level=relative, verdict=verdict, explanation=explanation,
            confidence=confidence, next_steps=steps, demo=demo,
            method="Références proposées : même famille de poste, poste exact prioritaire, qualités communes puis proximité du profil. Moyenne des références sélectionnées. Niveau relatif pondéré selon le poste, calculé uniquement sur les qualités renseignées. Il ne mesure pas la probabilité de devenir professionnel.")

    async def compare(self, request: CompareRequest):
        return self.compare_profiles(await self.profiles(), request)
