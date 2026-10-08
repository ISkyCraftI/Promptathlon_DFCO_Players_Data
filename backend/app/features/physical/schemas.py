from typing import Literal

from pydantic import BaseModel, Field

FlagCode = Literal["acwr_high", "acwr_low", "load_spike", "fatigue", "soreness", "return_soon"]


class Flag(BaseModel):
    code: FlagCode
    level: Literal["danger", "warn", "info"]
    label: str
    detail: str
    reviewed: bool


class ZoneCount(BaseModel):
    key: str
    label: str
    count: int


class SeriesPoint(BaseModel):
    date: str
    load: float
    acute: float
    chronic: float | None
    acwr: float | None


class PlayerLoad(BaseModel):
    id: str
    name: str
    role: str
    position: str
    status: str
    availability: str
    acute: int
    chronic: float
    acwr: float | None
    zone: str
    zone_label: str
    load_change: float
    fatigue: int
    flags: list[Flag]
    trend: list[int]


class ReturnToPlay(BaseModel):
    id: str
    name: str
    role: str
    status: str
    injury: str | None
    phase: str
    progress: int
    current_step: int
    steps: list[str]
    return_date: str | None
    days_left: int | None


class TeamLoad(BaseModel):
    weekly_load_avg: int
    acwr_avg: float | None
    load_change: float
    zones: list[ZoneCount]
    open_flags: int


class OverviewRead(BaseModel):
    reference_date: str
    team: TeamLoad
    team_series: list[SeriesPoint]
    players: list[PlayerLoad]
    returns: list[ReturnToPlay]


class Wellness(BaseModel):
    date: str
    author: str
    fatigue: int
    soreness: int
    rpe: int


class ReviewCreate(BaseModel):
    player_id: str
    flag: FlagCode
    note: str = Field(default="", max_length=600)
    author: str = Field(default="Staff", min_length=2, max_length=60)


class ReviewRead(BaseModel):
    id: int
    player_id: str
    flag: FlagCode
    note: str
    author: str
    date: str


class PlayerLoadDetail(BaseModel):
    player: PlayerLoad
    series: list[SeriesPoint]
    recovery: ReturnToPlay
    wellness: list[Wellness]
    reviews: list[ReviewRead]
