import { z } from "zod";

export const LedgerEntrySchema = z.object({
  category: z.string(),
  parameter: z.string(),
  impact_euros: z.number(),
  calculation_rule: z.string(),
});

export const ValuationSchema = z.object({
  player_id: z.string(),
  player_name: z.string(),
  position_key: z.string(),
  position_label: z.string(),
  base_league_value: z.number(),
  positional_performance_score: z.number(),
  value_after_performance: z.number(),
  value_after_age: z.number(),
  value_after_intangibles: z.number(),
  injury_discount_factor: z.number(),
  final_valuation: z.number(),
  recommended_wage_ceiling: z.object({
    monthly_euros: z.number(),
    annual_euros: z.number(),
    wage_to_value_ratio: z.number(),
  }),
  explainability_ledger: z.array(LedgerEntrySchema),
  formula_version: z.string(),
});

export type Valuation = z.infer<typeof ValuationSchema>;
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
