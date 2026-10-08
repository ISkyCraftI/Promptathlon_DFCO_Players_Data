import { z } from "zod";

export const FlagSchema = z.object({
  code: z.enum(["acwr_high", "acwr_low", "load_spike", "fatigue", "soreness", "return_soon"]),
  level: z.enum(["danger", "warn", "info"]), label: z.string(), detail: z.string(), reviewed: z.boolean(),
});
export const SeriesPointSchema = z.object({
  date: z.string(), load: z.number(), acute: z.number(), chronic: z.number().nullable(), acwr: z.number().nullable(),
});
export const PlayerLoadSchema = z.object({
  id: z.string(), name: z.string(), role: z.string(), position: z.string(), status: z.string(), availability: z.string(),
  acute: z.number(), chronic: z.number(), acwr: z.number().nullable(), zone: z.string(), zone_label: z.string(),
  load_change: z.number(), fatigue: z.number(), flags: z.array(FlagSchema), trend: z.array(z.number()),
});
export const ReturnToPlaySchema = z.object({
  id: z.string(), name: z.string(), role: z.string(), status: z.string(), injury: z.string().nullable(), phase: z.string(),
  progress: z.number(), current_step: z.number(), steps: z.array(z.string()), return_date: z.string().nullable(),
  days_left: z.number().nullable(),
});
export const TeamLoadSchema = z.object({
  weekly_load_avg: z.number(), acwr_avg: z.number().nullable(), load_change: z.number(),
  zones: z.array(z.object({ key: z.string(), label: z.string(), count: z.number() })), open_flags: z.number(),
});
export const OverviewSchema = z.object({
  reference_date: z.string(), team: TeamLoadSchema, team_series: z.array(SeriesPointSchema),
  players: z.array(PlayerLoadSchema), returns: z.array(ReturnToPlaySchema),
});
export const ReviewSchema = z.object({
  id: z.number(), player_id: z.string(), flag: FlagSchema.shape.code, note: z.string(), author: z.string(), date: z.string(),
});
export const PlayerLoadDetailSchema = z.object({
  player: PlayerLoadSchema, series: z.array(SeriesPointSchema), recovery: ReturnToPlaySchema,
  wellness: z.array(z.object({ date: z.string(), author: z.string(), fatigue: z.number(), soreness: z.number(), rpe: z.number() })),
  reviews: z.array(ReviewSchema),
});

export type Flag = z.infer<typeof FlagSchema>;
export type FlagCode = Flag["code"];
export type SeriesPoint = z.infer<typeof SeriesPointSchema>;
export type PlayerLoad = z.infer<typeof PlayerLoadSchema>;
export type ReturnToPlay = z.infer<typeof ReturnToPlaySchema>;
export type TeamLoad = z.infer<typeof TeamLoadSchema>;
export type PhysicalOverview = z.infer<typeof OverviewSchema>;
export type PlayerLoadDetail = z.infer<typeof PlayerLoadDetailSchema>;
export type Review = z.infer<typeof ReviewSchema>;
