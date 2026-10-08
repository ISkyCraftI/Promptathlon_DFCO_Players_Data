import { z } from "zod";
import { ReturnToPlaySchema, SeriesPointSchema, TeamLoadSchema } from "../physical/physical.model";

const DepthPlayerSchema = z.object({ id: z.string(), name: z.string(), position: z.string(), status: z.string(), overall: z.number().nullable() });
export const DashboardSchema = z.object({
  reference_date: z.string(),
  kpis: z.object({ squad_size: z.number(), available: z.number(), attention: z.number(), recovery: z.number(),
    open_flags: z.number(), avg_rating: z.number().nullable(), squad_value: z.number() }),
  depth: z.array(z.object({ role: z.string(), available: z.number(), total: z.number(), players: z.array(DepthPlayerSchema) })),
  lineup: z.array(z.object({ slot: z.string(), x: z.number(), y: z.number(), player: DepthPlayerSchema.nullable() })),
  form: z.array(z.object({ id: z.string(), name: z.string(), role: z.string(), rating: z.number(), minutes: z.number(),
    goals: z.number(), assists: z.number(), ratings: z.array(z.number().nullable()) })),
  activity: z.array(z.object({ player_id: z.string(), player_name: z.string(), author: z.string(), note: z.string(), date: z.string(),
    fatigue: z.number(), soreness: z.number() })),
  priorities: z.array(z.object({ player_id: z.string(), player_name: z.string(), level: z.enum(["danger", "warn", "info"]),
    title: z.string(), description: z.string(), section: z.string() })),
  returns: z.array(ReturnToPlaySchema),
  team_load: TeamLoadSchema,
  team_series: z.array(SeriesPointSchema),
  pipeline: z.array(z.object({ profile_id: z.number(), profile_name: z.string(), role: z.string(), candidate_id: z.string().nullable(),
    candidate_name: z.string().nullable(), score: z.number().nullable(), delta_vs_squad: z.number().nullable(),
    market_value: z.number().nullable() })),
});
export type Dashboard = z.infer<typeof DashboardSchema>;
