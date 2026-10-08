from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.players.controller import load_payloads
from app.features.recruitment.model import RecruitmentProfile
from app.features.recruitment.schemas import ProfileCreate, ProfileUpdate
from app.shared.exceptions import NotFoundError
from app.shared.football.scoring import similarity, weighted_fit
from app.shared.football.valuation import market_value

DEFAULT_PROFILES = [
    dict(name="Défenseur central relanceur", role="Défenseur", max_age=26,
         description="Solide dans les duels, propre à la relance courte comme longue.",
         weights=dict(interception=3, lucidite_defensive=3, tacle_debout=2, precision_de_la_tete=2, passe_courte=2,
                      passe_longue=2, calme=2, force=1)),
    dict(name="Latéral à gros volume", role="Défenseur", max_age=25,
         description="Capable de répéter les courses et d'apporter le centre.",
         weights=dict(vitesse_de_pointe=3, acceleration=2, endurance=3, centre=2, tacle_debout=2, interception=1)),
    dict(name="Sentinelle", role="Milieu", max_age=27,
         description="Coupe les lignes adverses et oriente le jeu simplement.",
         weights=dict(interception=3, lucidite_defensive=2, passe_courte=3, calme=2, endurance=2, force=1)),
    dict(name="Meneur de jeu", role="Milieu", max_age=26,
         description="Fait la dernière passe et casse les lignes balle au pied.",
         weights=dict(vista=3, passe_courte=3, passe_longue=2, conduite_de_balle=2, dribble=2, calme=2, tir_de_loin=1)),
    dict(name="Attaquant de profondeur", role="Attaquant", max_age=25,
         description="Attaque l'espace dans le dos de la défense et conclut.",
         weights=dict(acceleration=3, vitesse_de_pointe=3, finition=3, placement_offensif=2, conduite_de_balle=1)),
    dict(name="Gardien relanceur", role="Gardien", max_age=28,
         description="Réflexes sur sa ligne et jeu au pied pour construire.",
         weights=dict(gardien_reflexes=3, gardien_plongeon=2, gardien_placement=2, gardien_jeu_au_pied=3, calme=1)),
]


async def seed_profiles(session: AsyncSession) -> None:
    if (await session.execute(select(RecruitmentProfile.id).limit(1))).first() is None:
        session.add_all(RecruitmentProfile(**p) for p in DEFAULT_PROFILES)
        await session.commit()


def _read(profile: RecruitmentProfile) -> dict:
    return dict(id=profile.id, name=profile.name, role=profile.role, description=profile.description or "",
                weights=profile.weights, max_age=profile.max_age, min_overall=profile.min_overall)


class RecruitmentController:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _get(self, profile_id: int) -> RecruitmentProfile:
        profile = await self.session.get(RecruitmentProfile, profile_id)
        if profile is None:
            raise NotFoundError("Profil introuvable", "Ce profil de recrutement n'existe plus.", f"Unknown profile {profile_id}")
        return profile

    async def list_profiles(self) -> list[dict]:
        rows = (await self.session.execute(select(RecruitmentProfile).order_by(RecruitmentProfile.id))).scalars()
        return [_read(p) for p in rows]

    async def create_profile(self, payload: ProfileCreate) -> dict:
        profile = RecruitmentProfile(**payload.model_dump())
        self.session.add(profile)
        await self.session.commit()
        await self.session.refresh(profile)
        return _read(profile)

    async def update_profile(self, profile_id: int, payload: ProfileUpdate) -> dict:
        profile = await self._get(profile_id)
        for key, value in payload.model_dump().items():
            setattr(profile, key, value)
        await self.session.commit()
        await self.session.refresh(profile)
        return _read(profile)

    async def delete_profile(self, profile_id: int) -> None:
        await self.session.delete(await self._get(profile_id))
        await self.session.commit()

    async def shortlist(self, profile_id: int, limit: int = 15) -> dict:
        profile = _read(await self._get(profile_id))
        squad = [p for p in await load_payloads(self.session, "DFCO") if p["groupe_poste"] == profile["role"]]
        bench = sorted((dict(id=p["joueur_id"], name=p["nom"], overall=p.get("note_generale_fc27"),
                             score=weighted_fit(p, profile["weights"])["score"]) for p in squad),
                       key=lambda b: b["score"], reverse=True)
        best = bench[0]["score"] if bench else None
        candidates = []
        for p in await load_payloads(self.session, "PROSPECT"):
            if p["groupe_poste"] != profile["role"]:
                continue
            fit = weighted_fit(p, profile["weights"])
            reasons = []
            if profile["max_age"] and p["age"] > profile["max_age"]:
                reasons.append(f"Plus de {profile['max_age']} ans")
            overall = p.get("note_generale_fc27")
            if profile["min_overall"] and (overall or 0) < profile["min_overall"]:
                reasons.append(f"Note générale sous {profile['min_overall']}")
            candidates.append(dict(id=p["joueur_id"], name=p["nom"], kind=p["type_joueur"], age=p["age"],
                role=p["groupe_poste"], position=p.get("poste_fc27") or p["groupe_poste"], overall=overall,
                foot=p["pied_fort"], score=fit["score"], eligible=not reasons, reasons=reasons,
                strengths=fit["strengths"], weaknesses=fit["weaknesses"],
                delta_vs_squad=round(fit["score"] - best, 1) if best is not None else None, fc27_url=p.get("fc27_url"),
                market_value=market_value(p)))
        candidates.sort(key=lambda c: (c["eligible"], c["score"]), reverse=True)
        for rank, c in enumerate(candidates, start=1):
            c["rank"] = rank
        return dict(profile=profile, candidates=candidates[:limit], squad=bench, best_squad_score=best)

    async def similar(self, player_id: str, limit: int = 8) -> list[dict]:
        everyone = await load_payloads(self.session, None)
        source = next((p for p in everyone if p["joueur_id"] == player_id), None)
        if source is None:
            raise NotFoundError("Joueur introuvable", "Ce joueur ne fait pas partie de la base.", f"Unknown player {player_id}")
        pool = [p for p in everyone if p["type_joueur"] == "PROSPECT" and p["groupe_poste"] == source["groupe_poste"]
                and p["joueur_id"] != player_id]
        ranked = sorted(pool, key=lambda p: similarity(source, p), reverse=True)[:limit]
        return [dict(id=p["joueur_id"], name=p["nom"], kind=p["type_joueur"], age=p["age"], role=p["groupe_poste"],
                     position=p.get("poste_fc27") or p["groupe_poste"], overall=p.get("note_generale_fc27"),
                     similarity=similarity(source, p), market_value=market_value(p)) for p in ranked]
