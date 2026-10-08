from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.shared.football.catalog import LABELS

Role = Literal["Gardien", "Défenseur", "Milieu", "Attaquant"]


class ProfileBase(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    role: Role
    description: str = Field(default="", max_length=400)
    weights: dict[str, float]
    max_age: int | None = Field(default=None, ge=16, le=40)
    min_overall: int | None = Field(default=None, ge=0, le=99)

    @field_validator("weights")
    @classmethod
    def check_weights(cls, weights: dict[str, float]) -> dict[str, float]:
        unknown = [k for k in weights if k not in LABELS]
        if unknown:
            raise ValueError(f"Attributs inconnus : {', '.join(unknown)}")
        if any(v < 0 or v > 3 for v in weights.values()):
            raise ValueError("Chaque pondération doit être comprise entre 0 et 3.")
        cleaned = {k: v for k, v in weights.items() if v > 0}
        if not cleaned:
            raise ValueError("Pondérez au moins un attribut.")
        return cleaned


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    id: int


class Contribution(BaseModel):
    key: str
    label: str
    value: float
    weight: float


class CandidateRead(BaseModel):
    id: str
    name: str
    kind: Literal["DFCO", "PROSPECT"]
    age: int
    role: str
    position: str
    overall: int | None
    foot: str
    score: float
    rank: int
    eligible: bool
    reasons: list[str]
    strengths: list[Contribution]
    weaknesses: list[Contribution]
    delta_vs_squad: float | None
    fc27_url: str | None
    market_value: int


class SquadBenchmark(BaseModel):
    id: str
    name: str
    score: float
    overall: int | None


class ShortlistRead(BaseModel):
    profile: ProfileRead
    candidates: list[CandidateRead]
    squad: list[SquadBenchmark]
    best_squad_score: float | None


class SimilarRead(BaseModel):
    id: str
    name: str
    kind: Literal["DFCO", "PROSPECT"]
    age: int
    role: str
    position: str
    overall: int | None
    similarity: float
    market_value: int
