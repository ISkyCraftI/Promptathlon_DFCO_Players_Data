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

export const ClubPlayerValueSchema = z.object({
  id: z.string(), name: z.string(), kind: z.string(), role: z.string(), position: z.string(), age: z.number(),
  overall: z.number().nullable(), status: z.string(), market_value: z.number(), annual_wage: z.number(),
  injury_discount: z.number(),
});

export const ClubValueSchema = z.object({
  total_value: z.number(), squad_size: z.number(), average_value: z.number(),
  annual_wage_ceiling: z.number(), wage_to_value_ratio: z.number(),
  young_value: z.number(), young_count: z.number(), young_max_age: z.number(),
  unavailable_value: z.number(), unavailable_count: z.number(),
  prospects_count: z.number(), prospects_median_cost: z.number(),
  by_role: z.array(z.object({ role: z.string(), count: z.number(), total_value: z.number(), share: z.number(), top_player: z.string().nullable() })),
  players: z.array(ClubPlayerValueSchema),
  formula_version: z.string(),
});

export type ClubValue = z.infer<typeof ClubValueSchema>;
export type ClubPlayerValue = z.infer<typeof ClubPlayerValueSchema>;
