from typing import Literal

from pydantic import BaseModel


class PlayerLite(BaseModel):
    id: str
    name: str
    kind: Literal["DFCO", "PROSPECT"]
    age: int
    role: str
    position: str
    overall: int | None
    goalkeeper: bool
    ratings: dict[str, float]
    market_value: int


Mode = Literal["young", "squad", "prospect"]


class CandidatesRead(BaseModel):
    mode: Mode
    subjects: list[PlayerLite]
    references: list[PlayerLite]
    young_max_age: int


class GroupGap(BaseModel):
    key: str
    label: str
    subject: float
    reference: float
    gap: float


class AttributeGap(BaseModel):
    key: str
    label: str
    group: str
    subject: float
    reference: float
    gap: float
    importance: int
    impact: float


class Axis(BaseModel):
    key: str
    label: str
    group: str
    gap: float
    subject: float
    reference: float
    advice: str


class PhysicalSnapshot(BaseModel):
    weekly_load: int
    distance_km: float
    sprints: int
    max_speed: float
    minutes: int


class ComparisonRead(BaseModel):
    mode: Mode
    subject: PlayerLite
    reference: PlayerLite
    reference_auto: bool
    similarity: float
    overall_gap: int | None
    value_gap: int
    groups: list[GroupGap]
    attributes: list[AttributeGap]
    axes: list[Axis]
    strengths: list[AttributeGap]
    physical: dict[str, PhysicalSnapshot]
