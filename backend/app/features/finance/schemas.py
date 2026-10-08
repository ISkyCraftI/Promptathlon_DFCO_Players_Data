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
