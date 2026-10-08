from pydantic import BaseModel

from app.features.physical.schemas import ReturnToPlay, SeriesPoint, TeamLoad


class Kpis(BaseModel):
    squad_size: int
    available: int
    attention: int
    recovery: int
    open_flags: int
    avg_rating: float | None
    squad_value: int


class DepthPlayer(BaseModel):
    id: str
    name: str
    position: str
    status: str
    overall: int | None


class RoleDepth(BaseModel):
    role: str
    available: int
    total: int
    players: list[DepthPlayer]


class LineupSlot(BaseModel):
    slot: str
    x: float
    y: float
    player: DepthPlayer | None


class FormEntry(BaseModel):
    id: str
    name: str
    role: str
    rating: float
    minutes: int
    goals: int
    assists: int
    ratings: list[float | None]


class Activity(BaseModel):
    player_id: str
    player_name: str
    author: str
    note: str
    date: str
    fatigue: int
    soreness: int


class Priority(BaseModel):
    player_id: str
    player_name: str
    level: str
    title: str
    description: str
    section: str


class Pipeline(BaseModel):
    profile_id: int
    profile_name: str
    role: str
    candidate_id: str | None
    candidate_name: str | None
    score: float | None
    delta_vs_squad: float | None
    market_value: int | None


class DashboardRead(BaseModel):
    reference_date: str
    kpis: Kpis
    depth: list[RoleDepth]
    lineup: list[LineupSlot]
    form: list[FormEntry]
    activity: list[Activity]
    priorities: list[Priority]
    returns: list[ReturnToPlay]
    team_load: TeamLoad
    team_series: list[SeriesPoint]
    pipeline: list[Pipeline]
