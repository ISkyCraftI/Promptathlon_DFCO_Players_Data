#
# Imports
#

from pydantic import BaseModel, Field

#
# Schemas
#


class LedgerEntryRead(BaseModel):
    category: str
    parameter: str
    impact_euros: int
    calculation_rule: str


class WageCeilingRead(BaseModel):
    monthly_euros: int
    annual_euros: int
    wage_to_value_ratio: float


class ValuationRead(BaseModel):
    player_id: str
    player_name: str
    position_key: str
    position_label: str
    base_league_value: int
    positional_performance_score: float
    value_after_performance: int
    value_after_age: int
    value_after_intangibles: int
    injury_discount_factor: float
    final_valuation: int
    recommended_wage_ceiling: WageCeilingRead
    explainability_ledger: list[LedgerEntryRead] = Field(
        default_factory=list,
    )
    formula_version: str = "dfco-tpe-1.0"


class ClubPlayerValue(BaseModel):
    id: str
    name: str
    kind: str
    role: str
    position: str
    age: int
    overall: int | None
    status: str
    market_value: int
    annual_wage: int
    injury_discount: float


class RoleValue(BaseModel):
    role: str
    count: int
    total_value: int
    share: float
    top_player: str | None


class ClubValueRead(BaseModel):
    total_value: int
    squad_size: int
    average_value: int
    annual_wage_ceiling: int
    wage_to_value_ratio: float
    young_value: int
    young_count: int
    young_max_age: int
    unavailable_value: int
    unavailable_count: int
    prospects_count: int
    prospects_median_cost: int
    by_role: list[RoleValue]
    players: list[ClubPlayerValue]
    formula_version: str
