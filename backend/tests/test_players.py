import unittest

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.features.players.controller import PlayerController, seed_players
from app.features.players.schemas import FollowupCreate, PlayerDetailRead, PlayerRead
from app.shared.db.base import Base
from app.shared.exceptions import AppError


class PlayersTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with self.sessions() as session:
            await seed_players(session)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_roster_seed_is_idempotent_and_details_match_contract(self):
        async with self.sessions() as session:
            await seed_players(session)
            controller = PlayerController(session)
            roster = await controller.list_players()
            self.assertEqual(len(roster), 30)
            self.assertEqual(len({p["id"] for p in roster}), 30)
            for player in roster:
                PlayerRead.model_validate(player)
                detail = PlayerDetailRead.model_validate(await controller.detail(player["id"]))
                self.assertEqual(len(detail.sessions), 12)
                self.assertEqual(len(detail.matches), 4)
                self.assertTrue(all(s.simulated for s in detail.sessions))
                self.assertTrue(all(m.simulated for m in detail.matches))
                self.assertTrue(all(s.load == s.duration * s.rpe for s in detail.sessions))
                self.assertEqual(len(detail.attributes), 36)

    async def test_saved_followup_persists_and_updates_alerts_without_changing_ratings(self):
        async with self.sessions() as session:
            controller = PlayerController(session)
            before = await controller.detail("DFCO_020")
            entry = await controller.add_followup("DFCO_020", FollowupCreate(
                author="Joueur", note="  Gêne ressentie après la séance.  ", fatigue=80, soreness=5, rpe=7))
            self.assertEqual(entry["note"], "Gêne ressentie après la séance.")
            await seed_players(session)
        async with self.sessions() as session:
            controller = PlayerController(session)
            after = await controller.detail("DFCO_020")
            self.assertEqual(after["followups"][0]["id"], entry["id"])
            self.assertEqual(after["player"]["fatigue"], 80)
            self.assertEqual(after["attributes"], before["attributes"])
            self.assertEqual(after["player"]["status"], before["player"]["status"])
            self.assertIn("Gêne signalée par le joueur", [a["title"] for a in after["player"]["alerts"]])
            roster = await controller.list_players()
            self.assertEqual(next(p for p in roster if p["id"] == "DFCO_020")["fatigue"], 80)

    async def test_invalid_followups_and_unknown_players_are_rejected(self):
        with self.assertRaises(ValidationError):
            FollowupCreate(author="Joueur", note="Bilan", fatigue=101, soreness=0, rpe=4)
        async with self.sessions() as session:
            controller = PlayerController(session)
            with self.assertRaises(AppError):
                await controller.detail("unknown")
            with self.assertRaises(AppError):
                await controller.add_followup("DFCO_020", FollowupCreate(
                    author="Staff", note="   ", fatigue=20, soreness=0, rpe=4))
            self.assertEqual((await controller.detail("DFCO_020"))["followups"], [])


if __name__ == "__main__":
    unittest.main()
