import unittest

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.features.development.controller import DevelopmentController, seed_development
from app.features.development.schemas import ComparisonRead, CompareRequest, ProfileCreate, ProfileRead, FIELD_KEYS
from app.features.players.controller import seed_players
from app.shared.db.base import Base
from app.shared.exceptions import AppError


def fixture(profile_id, scores, position="CM", category="pro"):
    values = ProfileCreate(name=profile_id, age=20, position=position, ratings=scores)
    payload = values.model_dump(mode="json")
    payload.update(id=profile_id, category=category, role="Gardien" if position == "GK" else "Milieu",
        demo=False, editable=False, coverage=sum(v is not None for v in values.ratings.values()))
    return payload


class ComparisonMathTests(unittest.TestCase):
    def test_unknown_is_not_zero_and_does_not_produce_a_potential_verdict(self):
        target = fixture("target", {"passe": 0}, category="youth")
        reference = fixture("reference", dict.fromkeys(FIELD_KEYS, 50))
        result = DevelopmentController.compare_profiles([target, reference], CompareRequest(target_id="target"))
        self.assertIsNone(result["relative_level"])
        self.assertEqual(result["verdict"], "Données à compléter")
        self.assertEqual(len(result["missing"]), 5)
        passing = next(m for m in result["metrics"] if m["key"] == "passe")
        self.assertEqual(passing["delta"], -50)
        self.assertEqual(passing["value"], 0)

    def test_level_and_priorities_use_post_weights_and_available_reference_values(self):
        target = fixture("target", dict.fromkeys(FIELD_KEYS, 50), category="youth")
        first = fixture("first", dict.fromkeys(FIELD_KEYS, 100))
        second = fixture("second", {**dict.fromkeys(FIELD_KEYS, 100), "passe": None})
        result = DevelopmentController.compare_profiles([target, first, second], CompareRequest(target_id="target"))
        self.assertEqual(result["relative_level"], 50)
        self.assertEqual(result["priorities"][0]["key"], "passe")
        passing = next(m for m in result["metrics"] if m["key"] == "passe")
        self.assertEqual(passing["reference_count"], 1)
        self.assertEqual(passing["benchmark"], 100)
        self.assertIn("sans conclure", result["explanation"])

    def test_filters_reject_self_other_roles_and_manual_incompatible_references(self):
        target = fixture("target", dict.fromkeys(FIELD_KEYS, 60), category="youth")
        exact = fixture("exact", dict.fromkeys(FIELD_KEYS, 80))
        other_position = fixture("other", dict.fromkeys(FIELD_KEYS, 60), "CAM")
        goalkeeper = fixture("keeper", {}, "GK")
        profiles = [target, exact, other_position, goalkeeper]
        result = DevelopmentController.compare_profiles(profiles, CompareRequest(target_id="target", strict_position=True))
        self.assertEqual([p["id"] for p in result["references"]], ["exact"])
        with self.assertRaises(AppError):
            DevelopmentController.compare_profiles(profiles, CompareRequest(target_id="target", reference_ids=["keeper"]))
        with self.assertRaises(AppError):
            DevelopmentController.compare_profiles(profiles, CompareRequest(target_id="target", same_foot=True))
        empty = DevelopmentController.compare_profiles(profiles, CompareRequest(target_id="target", min_age=30))
        self.assertEqual(empty["verdict"], "Aucune référence adaptée")
        self.assertIsNone(empty["relative_level"])

    def test_identity_and_rating_validation(self):
        with self.assertRaises(ValidationError):
            ProfileCreate(name="  ", age=17, position="CM")
        with self.assertRaises(ValidationError):
            ProfileCreate(name="Test", age=17, position="GK", ratings={"frappe": 50})
        with self.assertRaises(ValidationError):
            ProfileCreate(name="Test", age=17, position="CM", ratings={"passe": 101})
        with self.assertRaises(ValidationError):
            CompareRequest(target_id="test", min_age=30, max_age=20)

    def test_zero_reference_level_is_reported_without_division_by_zero(self):
        target=fixture("target",dict.fromkeys(FIELD_KEYS,50),category="youth")
        reference=fixture("reference",dict.fromkeys(FIELD_KEYS,0))
        result=DevelopmentController.compare_profiles([target,reference],CompareRequest(target_id="target"))
        self.assertIsNone(result["relative_level"])
        self.assertEqual(result["verdict"],"Références à revoir")


class DevelopmentStorageTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with self.sessions() as session:
            await seed_players(session)
            await seed_development(session)

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def test_seed_and_every_comparison_contract(self):
        async with self.sessions() as session:
            await seed_development(session)
            controller = DevelopmentController(session)
            profiles = await controller.profiles()
            self.assertEqual(len(profiles), 110)
            self.assertEqual(sum(p["category"] == "youth" for p in profiles), 20)
            for profile in profiles:
                ProfileRead.model_validate(profile)
                result = ComparisonRead.model_validate(await controller.compare(CompareRequest(target_id=profile["id"])))
                self.assertTrue(all(p.id != profile["id"] for p in result.references))
                self.assertTrue(all(p.role == profile["role"] for p in result.references))

    async def test_create_partial_complete_and_seed_preserves_user_data(self):
        async with self.sessions() as session:
            controller = DevelopmentController(session)
            created = await controller.save(ProfileCreate(name="Jeune de test", age=16, position="CM"))
            self.assertEqual(created["coverage"], 0)
            self.assertFalse(created["demo"])
            completed = await controller.save(ProfileCreate(name="Jeune de test", age=16, position="CM",
                ratings=dict.fromkeys(FIELD_KEYS, 65), observations=4, minutes=180), created["id"])
            self.assertEqual(completed["coverage"], 6)
            await seed_development(session)
        async with self.sessions() as session:
            controller = DevelopmentController(session)
            result = await controller.compare(CompareRequest(target_id=created["id"]))
            self.assertEqual(result["target"]["observations"], 4)
            self.assertEqual(result["target"]["minutes"], 180)
            self.assertIsNotNone(result["relative_level"])
            with self.assertRaises(AppError):
                await controller.save(ProfileCreate(name="Test", age=17, position="CM"), "DFCO_020")


if __name__ == "__main__":
    unittest.main()
