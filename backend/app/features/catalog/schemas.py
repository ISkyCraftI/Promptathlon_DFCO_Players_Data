from pydantic import BaseModel


class AttributeRead(BaseModel):
    key: str
    label: str


class GroupRead(BaseModel):
    key: str
    label: str
    short: str
    attributes: list[AttributeRead]


class LoadZoneRead(BaseModel):
    key: str
    label: str
    min: float
    max: float


class CatalogRead(BaseModel):
    roles: list[str]
    groups: list[GroupRead]
    role_weights: dict[str, dict[str, int]]
    young_max_age: int
    load_zones: list[LoadZoneRead]
