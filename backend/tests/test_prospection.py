import unittest

from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
)

from app.features.players.controller import (
    PlayerController,
    seed_players,
)
from app.features.prospection.controller import (
    ProspectionController,
)
from app.features.prospection.schemas import (
    ProspectRead,
    SuggestionsResponse,
)
from app.shared.db.base import Base


class ProspectionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine(
            "sqlite+aiosqlite:///:memory:"
        )
        self.sessions = async_sessionmaker(
            self.engine, expire_on_commit=False
        )
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with self.sessions() as session:
            await seed_players(session)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_roster_stays_dfco_while_seed_has_prospects(
        self,
    ):
        async with self.sessions() as session:
            roster = await PlayerController(
                session
            ).list_players()
            prospects = await ProspectionController(
                session
            ).search()
            self.assertEqual(len(roster), 30)
            self.assertEqual(len(prospects), 60)
            for prospect in prospects:
                ProspectRead.model_validate(prospect)

    async def test_search_filters_by_role_and_ratings(self):
        async with self.sessions() as session:
            controller = ProspectionController(session)
            defense = await controller.search(
                role="Défenseur",
                defense_min=65,
            )
            self.assertTrue(defense)
            self.assertTrue(all(
                p["role"] == "Défenseur"
                and p["ratings"]["defense"] >= 65
                for p in defense
            ))
            named = await controller.search(q="Monzon")
            self.assertEqual(len(named), 1)
            self.assertEqual(named[0]["id"], "PRO_001")

    async def test_suggestions_cover_team_weaknesses(self):
        async with self.sessions() as session:
            payload = await ProspectionController(
                session
            ).suggestions(limit=5)
            SuggestionsResponse.model_validate(payload)
            self.assertGreaterEqual(
                payload["profile"]["roster_size"], 30
            )
            self.assertTrue(payload["profile"]["weaknesses"])
            self.assertTrue(payload["suggestions"])
            self.assertLessEqual(len(payload["suggestions"]), 5)
            top = payload["suggestions"][0]
            self.assertGreater(top["score"], 0)
            self.assertTrue(top["covers"] or top["reason"])


if __name__ == "__main__":
    unittest.main()
