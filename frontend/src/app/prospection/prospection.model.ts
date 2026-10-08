import { z } from "zod";

export const ProspectSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  position: z.string(),
  goalkeeper: z.boolean(),
  age: z.number(),
  height: z.number(),
  weight: z.number(),
  foot: z.string(),
  overall: z.number().nullable(),
  ratings: z.record(z.string(), z.number()),
  specialties: z.array(z.string()),
  playstyles: z.array(z.string()),
});

export const WeaknessSchema = z.object({
  key: z.string(),
  label: z.string(),
  team_avg: z.number(),
  gap: z.number(),
});

export const SuggestionsSchema = z.object({
  profile: z.object({
    averages: z.record(z.string(), z.number()),
    weaknesses: z.array(WeaknessSchema),
    roles: z.array(z.object({role: z.string(), count: z.number()})),
    roster_size: z.number(),
  }),
  suggestions: z.array(z.object({
    prospect: ProspectSchema,
    score: z.number(),
    covers: z.array(z.string()),
    reason: z.string(),
  })),
});

export type Prospect = z.infer<typeof ProspectSchema>;
export type SuggestionsPayload = z.infer<typeof SuggestionsSchema>;
export type Weakness = z.infer<typeof WeaknessSchema>;

export interface ProspectFilters {
  q: string;
  role: string | null;
  foot: string | null;
  age_min: number | null;
  age_max: number | null;
  overall_min: number | null;
  vitesse_min: number | null;
  frappe_min: number | null;
  passe_min: number | null;
  dribble_min: number | null;
  defense_min: number | null;
  physique_min: number | null;
}

export const EMPTY_FILTERS: ProspectFilters = {
  q: "",
  role: null,
  foot: null,
  age_min: null,
  age_max: null,
  overall_min: null,
  vitesse_min: null,
  frappe_min: null,
  passe_min: null,
  dribble_min: null,
  defense_min: null,
  physique_min: null,
};

export const RATING_FILTERS = [
  {key: "vitesse_min" as const, label: "Vitesse min", short: "VIT"},
  {key: "frappe_min" as const, label: "Frappe min", short: "TIR"},
  {key: "passe_min" as const, label: "Passe min", short: "PAS"},
  {key: "dribble_min" as const, label: "Dribble min", short: "DRI"},
  {key: "defense_min" as const, label: "Défense min", short: "DEF"},
  {key: "physique_min" as const, label: "Physique min", short: "PHY"},
];

export const STAT_SHORT: Record<string, string> = {
  vitesse: "VIT",
  frappe: "TIR",
  passe: "PAS",
  dribble: "DRI",
  defense: "DEF",
  physique: "PHY",
};
