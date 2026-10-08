import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string(), name: z.string(), category: z.enum(["youth", "pro", "prospect"]), age: z.number(),
  position: z.string(), role: z.string(), foot: z.string().nullable(), height: z.number().nullable(),
  weight: z.number().nullable(), ratings: z.record(z.string(), z.number().nullable()), observations: z.number(),
  minutes: z.number().nullable(), assessed_on: z.string().nullable(), note: z.string(), demo: z.boolean(),
  editable: z.boolean(), coverage: z.number(),
});
const MetricSchema = z.object({key: z.string(), label: z.string(), value: z.number().nullable(),
  benchmark: z.number().nullable(), delta: z.number().nullable(), weight: z.number(), reference_count: z.number(), action: z.string()});
export const ComparisonSchema = z.object({
  target: ProfileSchema, references: z.array(ProfileSchema), eligible: z.array(ProfileSchema),
  metrics: z.array(MetricSchema), priorities: z.array(MetricSchema), strengths: z.array(MetricSchema),
  missing: z.array(z.string()), relative_level: z.number().nullable(), verdict: z.string(), explanation: z.string(),
  confidence: z.string(), next_steps: z.array(z.string()), demo: z.boolean(), method: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type Category = Profile["category"];
export type ProfileInput = Pick<Profile, "name" | "age" | "position" | "foot" | "height" | "weight" | "ratings" | "observations" | "minutes" | "assessed_on" | "note"> & {category: "youth" | "prospect"};
export interface Criteria {reference_category: Category; strict_position: boolean; same_foot: boolean; min_age: number | null; max_age: number | null;}
export const FIELD_METRICS = [{key: "vitesse", label: "Vitesse"}, {key: "frappe", label: "Frappe"},
  {key: "passe", label: "Passe"}, {key: "dribble", label: "Dribble"}, {key: "defense", label: "Défense"}, {key: "physique", label: "Physique"}];
export const KEEPER_METRICS = [{key: "plongeon", label: "Plongeon"}, {key: "prise", label: "Prise de balle"},
  {key: "jeu_pied", label: "Jeu au pied"}, {key: "reflexes", label: "Réflexes"}, {key: "vitesse", label: "Vitesse"}, {key: "placement", label: "Placement"}];
export const POSITIONS = [{value:"GK",label:"Gardien"}, {value:"CB",label:"Défenseur central"}, {value:"LB",label:"Latéral gauche"},
  {value:"RB",label:"Latéral droit"}, {value:"CDM",label:"Milieu défensif"}, {value:"CM",label:"Milieu central"},
  {value:"CAM",label:"Milieu offensif"}, {value:"LM",label:"Milieu gauche"}, {value:"RM",label:"Milieu droit"},
  {value:"LW",label:"Ailier gauche"}, {value:"RW",label:"Ailier droit"}, {value:"ST",label:"Avant-centre"}];
