from pydantic import BaseModel, Field


class ProspectRead(BaseModel):
    id: str
    name: str
    role: str
    position: str
    goalkeeper: bool
    age: int
    height: int
    weight: float
    foot: str
    overall: int | None
    ratings: dict[str, float]
    specialties: list[str]
    playstyles: list[str]
    market_value: int


class WeaknessRead(BaseModel):
    key: str
    label: str
    team_avg: float
    gap: float


class RoleDepthRead(BaseModel):
    role: str
    count: int


class TeamProfileRead(BaseModel):
    averages: dict[str, float]
    weaknesses: list[WeaknessRead]
    roles: list[RoleDepthRead]
    roster_size: int


class SuggestionRead(BaseModel):
    prospect: ProspectRead
    score: float
    covers: list[str]
    reason: str


class SuggestionsResponse(BaseModel):
    profile: TeamProfileRead
    suggestions: list[SuggestionRead] = Field(default_factory=list)
