from typing import Literal

from pydantic import BaseModel, Field


class AlertRead(BaseModel):
    level: Literal["danger", "warn", "info"]
    title: str
    description: str
    action: str
    section: Literal["physical", "history", "attributes"]


class PlayerRead(BaseModel):
    id: str
    name: str
    kind: Literal["DFCO", "PROSPECT"]
    club: str | None
    role: str
    position: str
    goalkeeper: bool
    age: int
    height: int
    weight: float
    foot: str
    overall: int | None
    ratings: dict[str, float]
    status: str
    availability: str
    health: int
    fatigue: int
    satisfaction: int
    return_date: str | None
    fc27: bool
    fc27_url: str | None
    alerts: list[AlertRead]
    weekly_load: int
    load_change: float
    acwr: float | None
    load_zone: str
    market_value: int


class SessionRead(BaseModel):
    date: str
    label: str
    kind: str
    duration: int
    rpe: int
    load: int
    distance_km: float
    high_speed_m: int
    sprints: int
    max_speed: float
    simulated: bool = True


class MatchRead(BaseModel):
    date: str
    matchday: int
    venue: str
    opponent: str
    minutes: int
    goals: int
    assists: int
    pass_accuracy: int
    duels_won: int
    distance_km: float
    rating: float | None
    simulated: bool = True


class FollowupCreate(BaseModel):
    author: Literal["Staff", "Joueur"]
    note: str = Field(min_length=3, max_length=1500)
    fatigue: int = Field(ge=0, le=100)
    soreness: int = Field(ge=0, le=10)
    rpe: int = Field(ge=0, le=10)


class FollowupRead(BaseModel):
    id: int
    date: str
    author: Literal["Staff", "Joueur"]
    note: str
    fatigue: int
    soreness: int
    rpe: int


class RecoveryRead(BaseModel):
    active: bool
    progress: int
    phase: str
    steps: list[str]
    current_step: int
    return_date: str | None
    days_left: int | None
    injury: str | None


class PlayerDetailRead(BaseModel):
    player: PlayerRead
    reference_date: str
    attributes: dict[str, int | None]
    tags: list[str]
    specialties: list[str]
    playstyles: list[str]
    languages: list[str]
    team_relation: str
    satisfaction_reason: str
    injuries: list[dict]
    relations: list[dict]
    sessions: list[SessionRead]
    matches: list[MatchRead]
    followups: list[FollowupRead]
    recovery: RecoveryRead
