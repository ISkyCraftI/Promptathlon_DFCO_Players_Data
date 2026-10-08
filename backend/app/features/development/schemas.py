from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Position = Literal["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "ST"]
Rating = Annotated[int, Field(strict=True, ge=0, le=100)]
FIELD_KEYS = ["vitesse", "frappe", "passe", "dribble", "defense", "physique"]
KEEPER_KEYS = ["plongeon", "prise", "jeu_pied", "reflexes", "vitesse", "placement"]


class ProfileCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    category: Literal["youth", "prospect"] = "youth"
    age: int = Field(ge=12, le=45, strict=True)
    position: Position
    foot: Literal["Droit", "Gauche", "Les deux"] | None = None
    height: int | None = Field(default=None, ge=120, le=230)
    weight: float | None = Field(default=None, ge=25, le=150)
    ratings: dict[str, Rating | None] = Field(default_factory=dict)
    observations: int = Field(default=0, ge=0, le=500, strict=True)
    minutes: int | None = Field(default=None, ge=0, le=20000)
    assessed_on: date | None = None
    note: str = Field(default="", max_length=1500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Renseignez un nom de deux caractères minimum.")
        return value

    @model_validator(mode="after")
    def validate_ratings(self):
        allowed = KEEPER_KEYS if self.position == "GK" else FIELD_KEYS
        if set(self.ratings) - set(allowed):
            raise ValueError("Qualités incompatibles avec ce poste.")
        if self.assessed_on and self.assessed_on > date.today():
            raise ValueError("La date d'observation ne peut pas être future.")
        self.ratings = {key: self.ratings.get(key) for key in allowed}
        return self


class ProfileRead(BaseModel):
    id: str
    name: str
    category: Literal["youth", "pro", "prospect"]
    age: int
    position: str
    role: str
    foot: str | None
    height: int | None
    weight: float | None
    ratings: dict[str, int | float | None]
    observations: int
    minutes: int | None
    assessed_on: str | None
    note: str
    demo: bool
    editable: bool
    coverage: int


class CompareRequest(BaseModel):
    target_id: str
    reference_category: Literal["pro", "prospect", "youth"] = "pro"
    strict_position: bool = False
    same_foot: bool = False
    min_age: int | None = Field(default=None, ge=12, le=45)
    max_age: int | None = Field(default=None, ge=12, le=45)
    reference_ids: list[str] | None = Field(default=None, min_length=1, max_length=5)

    @model_validator(mode="after")
    def validate_ages(self):
        if self.min_age is not None and self.max_age is not None and self.min_age > self.max_age:
            raise ValueError("L'âge minimum doit précéder l'âge maximum.")
        if self.reference_ids and len(set(self.reference_ids)) != len(self.reference_ids):
            raise ValueError("Les références doivent être différentes.")
        return self


class MetricRead(BaseModel):
    key: str
    label: str
    value: float | None
    benchmark: float | None
    delta: float | None
    weight: float
    reference_count: int
    action: str


class ComparisonRead(BaseModel):
    target: ProfileRead
    references: list[ProfileRead]
    eligible: list[ProfileRead]
    metrics: list[MetricRead]
    priorities: list[MetricRead]
    strengths: list[MetricRead]
    missing: list[str]
    relative_level: float | None
    verdict: str
    explanation: str
    confidence: str
    next_steps: list[str]
    demo: bool
    method: str
