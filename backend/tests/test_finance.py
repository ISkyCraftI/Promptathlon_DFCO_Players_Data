import unittest

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.features.finance.controller import FinanceController, value_player
from app.features.finance.schemas import ClubValueRead, ValuationRead
from app.features.players.controller import seed_players
from app.features.players.model import Player
from app.shared.db.base import Base
from app.shared.exceptions import AppError


class FinanceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        self.sessions = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
        )
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with self.sessions() as session:
            await seed_players(session)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_valuation_is_auditable_and_matches_contract(self):
        async with self.sessions() as session:
            controller = FinanceController(session)
            result = await controller.valuation("DFCO_020")
            parsed = ValuationRead.model_validate(result)
            self.assertGreater(parsed.final_valuation, 0)
            self.assertGreater(
                parsed.positional_performance_score,
                0,
            )
            self.assertEqual(
                parsed.recommended_wage_ceiling.annual_euros,
                int(round(parsed.final_valuation * 0.10)),
            )
            ledger_sum = sum(
                e.impact_euros
                for e in parsed.explainability_ledger
                if e.category != "Salaire recommandé"
            )
            self.assertEqual(ledger_sum, parsed.final_valuation)
            self.assertTrue(
                any(
                    e.category == "Age Curve"
                    for e in parsed.explainability_ledger
                ),
            )
            self.assertTrue(
                any(
                    e.category == "Durability Risk"
                    for e in parsed.explainability_ledger
                ),
            )

    async def test_unknown_player_is_rejected(self):
        async with self.sessions() as session:
            controller = FinanceController(session)
            with self.assertRaises(AppError):
                await controller.valuation("unknown")

    async def test_engine_applies_age_and_injury_directionally(self):
        async with self.sessions() as session:
            entity = await session.get(Player, "DFCO_020")
            payload = entity.payload
            young = dict(payload)
            young["age"] = 20
            young["injuries"] = []
            young["statut_sante"] = "Disponible"
            young["sante_score"] = 95
            old = dict(payload)
            old["age"] = 34
            old["injuries"] = [
                {
                    "type_blessure": "Rupture",
                    "gravite": "Grave",
                    "debut": "2025-01-01",
                    "retour_prevu": "2025-06-01",
                    "retour_effectif": "2025-06-01",
                    "statut": "Terminée",
                },
            ]
            old["statut_sante"] = "Blessé"
            old["sante_score"] = 40
            v_young = value_player(young, [])
            v_old = value_player(old, [])
            self.assertGreater(
                v_young["final_valuation"],
                v_old["final_valuation"],
            )
            self.assertLess(
                v_old["injury_discount_factor"],
                v_young["injury_discount_factor"],
            )

    async def test_club_value_sums_squad_and_prospects_are_priced(self):
        async with self.sessions() as session:
            controller = FinanceController(session)
            club = ClubValueRead.model_validate(await controller.club())
            self.assertEqual(club.squad_size, 30)
            self.assertEqual(club.total_value, sum(p.market_value for p in club.players))
            self.assertEqual(club.total_value, sum(r.total_value for r in club.by_role))
            self.assertTrue(all(p.kind == "DFCO" for p in club.players))
            values = [p.market_value for p in club.players]
            self.assertEqual(values, sorted(values, reverse=True))
            prospect = next(p for p in (await session.execute(select(Player))).scalars()
                            if p.payload["type_joueur"] == "PROSPECT")
            valuation = await controller.valuation(prospect.id)
            self.assertGreater(valuation["final_valuation"], 0)


if __name__ == "__main__":
    unittest.main()
