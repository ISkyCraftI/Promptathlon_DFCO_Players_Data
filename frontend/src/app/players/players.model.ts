import { z } from "zod";

export const AlertSchema = z.object({
  level: z.enum(["danger", "warn", "info"]), title: z.string(), description: z.string(),
  action: z.string(), section: z.enum(["physical", "history", "attributes"]),
});
export const PlayerSchema = z.object({
  id: z.string(), name: z.string(), role: z.string(), position: z.string(), goalkeeper: z.boolean(),
  age: z.number(), height: z.number(), weight: z.number(), foot: z.string(), overall: z.number().nullable(),
  ratings: z.record(z.string(), z.number()), status: z.string(), availability: z.string(),
  health: z.number(), fatigue: z.number(), satisfaction: z.number(), return_date: z.string().nullable(),
  alerts: z.array(AlertSchema),
  weekly_load: z.number(), load_change: z.number(),
});
const SessionSchema = z.object({
  date: z.string(), label: z.string(), duration: z.number(), rpe: z.number(), load: z.number(),
  distance_km: z.number(), high_speed_m: z.number(), sprints: z.number(), max_speed: z.number(), simulated: z.boolean(),
});
const MatchSchema = z.object({
  date: z.string(), opponent: z.string(), minutes: z.number(), goals: z.number(), assists: z.number(),
  pass_accuracy: z.number(), duels_won: z.number(), simulated: z.boolean(),
});
export const FollowupSchema = z.object({
  id: z.number(), date: z.string(), author: z.enum(["Staff", "Joueur"]), note: z.string(),
  fatigue: z.number(), soreness: z.number(), rpe: z.number(),
});
export const PlayerDetailSchema = z.object({
  player: PlayerSchema, reference_date: z.string(), attributes: z.record(z.string(), z.number().nullable()),
  tags: z.array(z.string()), specialties: z.array(z.string()), playstyles: z.array(z.string()),
  languages: z.array(z.string()), team_relation: z.string(), satisfaction_reason: z.string(),
  injuries: z.array(z.object({blessure_id: z.string(), type_blessure: z.string(), zone: z.string(),
    debut: z.string(), retour_prevu: z.string(), retour_effectif: z.string().nullable(), statut: z.string(), gravite: z.string()})),
  relations: z.array(z.object({relation_id: z.string(), target_name: z.string(), polarite: z.enum(["POSITIF", "NEGATIF"]),
    motif: z.string(), nature: z.string(), intensite: z.number(), joueur_cible_id: z.string()})),
  sessions: z.array(SessionSchema), matches: z.array(MatchSchema), followups: z.array(FollowupSchema),
  recovery: z.object({active: z.boolean(), progress: z.number(), phase: z.string(), steps: z.array(z.string()),
    current_step: z.number(), return_date: z.string().nullable()}),
});
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerDetail = z.infer<typeof PlayerDetailSchema>;
export type Followup = z.infer<typeof FollowupSchema>;
export type FollowupInput = Omit<Followup, "id" | "date">;
export interface LoadState<T> { data: T | null; loading: boolean; error: string | null; }

export const STAT_GROUPS = [
  {key: "vitesse", label: "Vitesse", short: "VIT", color: "#f15b64", attributes: [["acceleration", "Accélération"], ["vitesse_de_pointe", "Vitesse de pointe"]]},
  {key: "frappe", label: "Frappe", short: "TIR", color: "#f0aa69", attributes: [["placement_offensif", "Placement offensif"], ["finition", "Finition"], ["puissance_de_tir", "Puissance de tir"], ["tir_de_loin", "Tir de loin"], ["volee", "Volée"], ["penalty", "Pénalty"]]},
  {key: "passe", label: "Passe", short: "PAS", color: "#e1cc91", attributes: [["vista", "Vista"], ["centre", "Centre"], ["precision_coup_franc", "Précision coup franc"], ["passe_courte", "Passe courte"], ["passe_longue", "Passe longue"], ["effet", "Effet"]]},
  {key: "dribble", label: "Dribble", short: "DRI", color: "#6fb99d", attributes: [["agilite", "Agilité"], ["equilibre", "Équilibre"], ["reactivite", "Réactivité"], ["conduite_de_balle", "Conduite de balle"], ["dribble", "Dribble"], ["calme", "Calme"]]},
  {key: "defense", label: "Défense", short: "DEF", color: "#79a7d9", attributes: [["interception", "Interception"], ["precision_de_la_tete", "Précision de la tête"], ["lucidite_defensive", "Lucidité défensive"], ["tacle_debout", "Tacle debout"], ["tacle_glisse", "Tacle glissé"]]},
  {key: "physique", label: "Physique", short: "PHY", color: "#b29ecb", attributes: [["detente", "Détente"], ["endurance", "Endurance"], ["force", "Force"], ["agressivite", "Agressivité"]]},
];
export const GOALKEEPER_STATS = [["gardien_plongeon", "Plongeon"], ["gardien_prise_de_balle", "Prise de balle"],
  ["gardien_jeu_au_pied", "Jeu au pied"], ["gardien_reflexes", "Réflexes"], ["gardien_vitesse", "Vitesse gardien"],
  ["gardien_placement", "Placement gardien"], ["gardien_sorties", "Sorties · simulation"]];
