"""
	Recherche de prospects et suggestions selon les faiblesses DFCO.
"""

#
# Imports
#

from collections import Counter
from unicodedata import normalize

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Perso

from app.features.players.controller import ATTRIBUTES
from app.features.players.model import Player

#
# Constants
#

RATING_LABELS = {
    "vitesse": "Vitesse",
    "frappe": "Frappe",
    "passe": "Passe",
    "dribble": "Dribble",
    "defense": "Défense",
    "physique": "Physique",
}
RATING_KEYS = list(ATTRIBUTES.keys())


#
# ProspectionController
#

class ProspectionController:
    def __init__(self, session: AsyncSession):
        self.session = session

    @staticmethod
    def _norm(value: str) -> str:
        return normalize("NFD", value).encode(
            "ascii", "ignore"
        ).decode("ascii").lower()

    @staticmethod
    def _to_prospect(payload: dict) -> dict:
        return dict(
            id=payload["joueur_id"],
            name=payload["nom"],
            role=payload["groupe_poste"],
            position=payload.get("poste_fc27")
            or payload["groupe_poste"],
            goalkeeper=payload["gardien"],
            age=payload["age"],
            height=payload["taille_cm"],
            weight=payload["poids_kg"],
            foot=payload["pied_fort"],
            overall=payload.get("note_generale_fc27"),
            ratings={
                key: payload["note_" + key]
                for key in RATING_KEYS
            },
            specialties=payload.get("specialite_tags", []),
            playstyles=payload.get(
                "playstyles_fc27_observes", []
            ),
        )

    async def _payloads(
        self, player_type: str | None = None
    ) -> list[dict]:
        rows = list((await self.session.execute(
            select(Player).order_by(Player.id)
        )).scalars())
        payloads = [row.payload for row in rows]
        if player_type is None:
            return payloads
        return [
            p for p in payloads
            if p.get("type_joueur") == player_type
        ]

    def _team_profile(self, roster: list[dict]) -> dict:
        field = [p for p in roster if not p["gardien"]]
        sample = field or roster
        averages = {
            key: round(
                sum(p["note_" + key] for p in sample)
                / len(sample),
                1,
            )
            for key in RATING_KEYS
        }
        mean_avg = sum(averages.values()) / len(averages)
        weaknesses = sorted(
            [
                dict(
                    key=key,
                    label=RATING_LABELS[key],
                    team_avg=avg,
                    gap=round(mean_avg - avg, 1),
                )
                for key, avg in averages.items()
                if avg < mean_avg
            ],
            key=lambda item: -item["gap"],
        )
        roles = [
            dict(role=role, count=count)
            for role, count in sorted(
                Counter(
                    p["groupe_poste"] for p in roster
                ).items()
            )
        ]
        return dict(
            averages=averages,
            weaknesses=weaknesses,
            roles=roles,
            roster_size=len(roster),
        )

    def _score_prospect(
        self,
        payload: dict,
        profile: dict,
    ) -> tuple[float, list[str], str]:
        weaknesses = profile["weaknesses"]
        role_counts = {
            item["role"]: item["count"]
            for item in profile["roles"]
        }
        covers: list[str] = []
        score = 0.0
        for weak in weaknesses:
            rating = payload["note_" + weak["key"]]
            uplift = rating - weak["team_avg"]
            if uplift <= 0:
                continue
            weight = 1 + max(weak["gap"], 0) / 10
            score += uplift * weight
            covers.append(weak["key"])
        role = payload["groupe_poste"]
        depth = role_counts.get(role, 0)
        if depth <= 6:
            score += 8
        elif depth <= 9:
            score += 3
        overall = payload.get("note_generale_fc27") or 0
        score += max(0, overall - 65) * 0.4
        if covers:
            labels = [
                RATING_LABELS[key] for key in covers[:3]
            ]
            reason = (
                f"Renforce {', '.join(labels).lower()} "
                f"par rapport à l’effectif."
            )
        else:
            reason = (
                "Profil complémentaire à surveiller "
                "hors effectif."
            )
        if depth <= 6:
            reason += f" Poste {role.lower()} à densifier."
        return round(score, 1), covers, reason

    async def search(
        self,
        q: str | None = None,
        role: str | None = None,
        foot: str | None = None,
        age_min: int | None = None,
        age_max: int | None = None,
        overall_min: int | None = None,
        vitesse_min: int | None = None,
        frappe_min: int | None = None,
        passe_min: int | None = None,
        dribble_min: int | None = None,
        defense_min: int | None = None,
        physique_min: int | None = None,
    ) -> list[dict]:
        mins = {
            "vitesse": vitesse_min,
            "frappe": frappe_min,
            "passe": passe_min,
            "dribble": dribble_min,
            "defense": defense_min,
            "physique": physique_min,
        }
        needle = self._norm(q) if q else ""
        results = []
        for payload in await self._payloads("PROSPECT"):
            if role and payload["groupe_poste"] != role:
                continue
            if foot and payload["pied_fort"] != foot:
                continue
            if age_min is not None and payload["age"] < age_min:
                continue
            if age_max is not None and payload["age"] > age_max:
                continue
            overall = payload.get("note_generale_fc27")
            if (
                overall_min is not None
                and (overall is None or overall < overall_min)
            ):
                continue
            if needle and needle not in self._norm(
                payload["nom"]
            ):
                continue
            skip = False
            for key, minimum in mins.items():
                if (
                    minimum is not None
                    and payload["note_" + key] < minimum
                ):
                    skip = True
                    break
            if skip:
                continue
            results.append(self._to_prospect(payload))
        results.sort(
            key=lambda item: (
                -(item["overall"] or 0),
                item["name"],
            )
        )
        return results

    async def suggestions(
        self,
        limit: int = 8,
        role: str | None = None,
    ) -> dict:
        roster = await self._payloads("DFCO")
        prospects = await self._payloads("PROSPECT")
        profile = self._team_profile(roster)
        ranked = []
        for payload in prospects:
            if role and payload["groupe_poste"] != role:
                continue
            score, covers, reason = self._score_prospect(
                payload, profile
            )
            if score <= 0:
                continue
            ranked.append(dict(
                prospect=self._to_prospect(payload),
                score=score,
                covers=covers,
                reason=reason,
            ))
        ranked.sort(key=lambda item: -item["score"])
        return dict(
            profile=profile,
            suggestions=ranked[: max(1, min(limit, 20))],
        )
