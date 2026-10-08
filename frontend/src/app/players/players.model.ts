import { z } from "zod";

export const AlertSchema = z.object({
  level: z.enum(["danger", "warn", "info"]), title: z.string(), description: z.string(),
  action: z.string(), section: z.enum(["physical", "history", "attributes"]),
});
export const PlayerSchema = z.object({
  id: z.string(), name: z.string(), kind: z.enum(["DFCO", "PROSPECT"]), club: z.string().nullable(),
  role: z.string(), position: z.string(), goalkeeper: z.boolean(),
  age: z.number(), height: z.number(), weight: z.number(), foot: z.string(), overall: z.number().nullable(),
  ratings: z.record(z.string(), z.number()), status: z.string(), availability: z.string(),
  health: z.number(), fatigue: z.number(), satisfaction: z.number(), return_date: z.string().nullable(),
  fc27: z.boolean(), fc27_url: z.string().nullable(), alerts: z.array(AlertSchema),
  weekly_load: z.number(), load_change: z.number(), acwr: z.number().nullable(), load_zone: z.string(),
  market_value: z.number(),
});
export const SessionSchema = z.object({
  date: z.string(), label: z.string(), kind: z.string(), duration: z.number(), rpe: z.number(), load: z.number(),
  distance_km: z.number(), high_speed_m: z.number(), sprints: z.number(), max_speed: z.number(), simulated: z.boolean(),
});
export const MatchSchema = z.object({
  date: z.string(), matchday: z.number(), venue: z.string(), opponent: z.string(), minutes: z.number(),
  goals: z.number(), assists: z.number(), pass_accuracy: z.number(), duels_won: z.number(),
  distance_km: z.number(), rating: z.number().nullable(), simulated: z.boolean(),
});
export const FollowupSchema = z.object({
  id: z.number(), date: z.string(), author: z.enum(["Staff", "Joueur"]), note: z.string(),
  fatigue: z.number(), soreness: z.number(), rpe: z.number(),
});
export const RecoverySchema = z.object({
  active: z.boolean(), progress: z.number(), phase: z.string(), steps: z.array(z.string()),
  current_step: z.number(), return_date: z.string().nullable(), days_left: z.number().nullable(), injury: z.string().nullable(),
});
export const InjurySchema = z.object({
  blessure_id: z.string(), type_blessure: z.string(), zone: z.string(), debut: z.string(), retour_prevu: z.string(),
  retour_effectif: z.string().nullable(), statut: z.string(), gravite: z.string(),
});
export const RelationSchema = z.object({
  relation_id: z.string(), target_name: z.string(), polarite: z.enum(["POSITIF", "NEGATIF"]),
  motif: z.string(), nature: z.string(), intensite: z.number(), joueur_cible_id: z.string(),
});
export const PlayerDetailSchema = z.object({
  player: PlayerSchema, reference_date: z.string(), attributes: z.record(z.string(), z.number().nullable()),
  tags: z.array(z.string()), specialties: z.array(z.string()), playstyles: z.array(z.string()),
  languages: z.array(z.string()), team_relation: z.string(), satisfaction_reason: z.string(),
  injuries: z.array(InjurySchema), relations: z.array(RelationSchema),
  sessions: z.array(SessionSchema), matches: z.array(MatchSchema), followups: z.array(FollowupSchema),
  recovery: RecoverySchema,
});

export type Alert = z.infer<typeof AlertSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerDetail = z.infer<typeof PlayerDetailSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Followup = z.infer<typeof FollowupSchema>;
export type FollowupInput = Omit<Followup, "id" | "date">;
export type Recovery = z.infer<typeof RecoverySchema>;
export type PlayerKind = "DFCO" | "PROSPECT" | "ALL";

/** Groupes de notes FC (ordre d'affichage, raccourcis de carte). Les libellés détaillés viennent du catalogue API. */
export const RATING_GROUPS = [
  { key: "vitesse", label: "Vitesse", short: "VIT" },
  { key: "frappe", label: "Frappe", short: "TIR" },
  { key: "passe", label: "Passe", short: "PAS" },
  { key: "dribble", label: "Dribble", short: "DRI" },
  { key: "defense", label: "Défense", short: "DEF" },
  { key: "physique", label: "Physique", short: "PHY" },
] as const;
