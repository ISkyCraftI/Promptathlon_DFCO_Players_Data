import unittest

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.features.physical.model  # noqa: F401
import app.features.recruitment.model  # noqa: F401
from app.features.coach.controller import CoachController
from app.features.coach.schemas import DashboardRead
from app.features.comparison.controller import ComparisonController
from app.features.comparison.schemas import ComparisonRead
from app.features.physical.controller import PhysicalController
from app.features.physical.schemas import OverviewRead, ReviewCreate
from app.features.players.controller import seed_players
from app.features.recruitment.controller import RecruitmentController, seed_profiles
from app.features.recruitment.schemas import ProfileCreate, ShortlistRead
from app.shared.db.base import Base
from app.shared.exceptions import AppError, NotFoundError
from app.shared.football.scoring import similarity, weighted_fit


class FeatureTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with self.sessions() as session:
            await seed_players(session)
            await seed_profiles(session)
            await seed_profiles(session)

    async def asyncTearDown(self):
        await self.engine.dispose()

    def test_scoring_bounds(self):
        p = {"gardien": False, "finition": 80, "vista": 40}
        self.assertEqual(weighted_fit(p, {"finition": 1, "vista": 1})["score"], 60)
        self.assertEqual(weighted_fit(p, {"finition": 3, "vista": 0})["score"], 80)

    async def test_recruitment_profiles_and_shortlist(self):
        async with self.sessions() as session:
            controller = RecruitmentController(session)
            profiles = await controller.list_profiles()
            self.assertEqual(len(profiles), 6)
            created = await controller.create_profile(ProfileCreate(
                name="Ailier percutant", role="Attaquant", weights={"dribble": 3, "acceleration": 2, "vista": 0}, max_age=23))
            self.assertNotIn("vista", created["weights"])
            shortlist = ShortlistRead.model_validate(await controller.shortlist(created["id"], 60))
            self.assertTrue(all(c.role == "Attaquant" and c.kind == "PROSPECT" for c in shortlist.candidates))
            eligible = [c for c in shortlist.candidates if c.eligible]
            self.assertEqual([c.score for c in eligible], sorted([c.score for c in eligible], reverse=True))
            self.assertTrue(all(c.age > 23 for c in shortlist.candidates if not c.eligible))
            await controller.delete_profile(created["id"])
            with self.assertRaises(NotFoundError):
                await controller.shortlist(created["id"])
        with self.assertRaises(ValidationError):
            ProfileCreate(name="Vide", role="Milieu", weights={"vista": 0})
        with self.assertRaises(ValidationError):
            ProfileCreate(name="Inconnu", role="Milieu", weights={"magie": 2})

    async def test_similarity_is_symmetric_and_self_is_max(self):
        a = {"gardien": False, "finition": 80, "vista": 40, "force": 60}
        b = {"gardien": False, "finition": 40, "vista": 80, "force": 60}
        self.assertEqual(similarity(a, a), 100)
        self.assertEqual(similarity(a, b), similarity(b, a))

    async def test_comparison_same_role_and_auto_reference(self):
        async with self.sessions() as session:
            controller = ComparisonController(session)
            candidates = await controller.candidates("young")
            self.assertTrue(all(p["kind"] == "DFCO" and p["age"] <= 21 for p in candidates["subjects"]))
            self.assertTrue(all(p["kind"] == "DFCO" and p["age"] > 21 for p in candidates["references"]))
            young = candidates["subjects"][0]
            result = ComparisonRead.model_validate(await controller.compare(young["id"], None, "young"))
            self.assertEqual(result.subject.role, result.reference.role)
            self.assertGreater(result.reference.age, 21)
            self.assertTrue(all(a.gap > 0 for a in result.axes))
            self.assertEqual(result.value_gap, result.reference.market_value - result.subject.market_value)
            other_role = next(p for p in candidates["references"] if p["role"] != young["role"])
            with self.assertRaises(AppError):
                await controller.compare(young["id"], other_role["id"], "young")

    async def test_comparison_modes_squad_and_prospect(self):
        async with self.sessions() as session:
            controller = ComparisonController(session)
            squad = await controller.candidates("squad")
            self.assertEqual(len(squad["subjects"]), 30)
            self.assertTrue(all(p["kind"] == "DFCO" for p in squad["references"]))
            first = squad["subjects"][0]
            result = await controller.compare(first["id"], None, "squad")
            self.assertNotEqual(result["reference"]["id"], first["id"])
            self.assertEqual(result["reference"]["kind"], "DFCO")
            with self.assertRaises(AppError):
                await controller.compare(first["id"], first["id"], "squad")
            prospects = await controller.candidates("prospect")
            self.assertTrue(all(p["kind"] == "PROSPECT" for p in prospects["subjects"]))
            self.assertTrue(all(p["kind"] == "DFCO" for p in prospects["references"]))
            scout = ComparisonRead.model_validate(
                await controller.compare(prospects["subjects"][0]["id"], None, "prospect"))
            self.assertEqual(scout.reference.kind, "DFCO")
            self.assertEqual(scout.subject.role, scout.reference.role)

    async def test_physical_overview_and_reviews(self):
        async with self.sessions() as session:
            controller = PhysicalController(session)
            overview = OverviewRead.model_validate(await controller.overview())
            self.assertEqual(len(overview.players), 30)
            self.assertEqual(len(overview.team_series), 21)
            flagged = next(p for p in overview.players if p.flags)
            flag = flagged.flags[0]
            await controller.add_review(ReviewCreate(player_id=flagged.id, flag=flag.code, note="Vu en réunion"))
            after = OverviewRead.model_validate(await controller.overview())
            self.assertEqual(after.team.open_flags, overview.team.open_flags - 1)
            self.assertTrue(all(r.days_left is not None for r in overview.returns))

    async def test_coach_dashboard_lineup_uses_available_players(self):
        async with self.sessions() as session:
            dashboard = DashboardRead.model_validate(await CoachController(session).dashboard())
            self.assertEqual(len(dashboard.lineup), 11)
            picked = [s.player for s in dashboard.lineup if s.player]
            self.assertEqual(len({p.id for p in picked}), len(picked))
            self.assertTrue(all(p.status in ("Disponible", "Vigilance") for p in picked))
            self.assertEqual(sum(d.total for d in dashboard.depth), 30)


if __name__ == "__main__":
    unittest.main()
