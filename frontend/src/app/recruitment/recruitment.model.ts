import { z } from "zod";

export const ROLES = ["Gardien", "Défenseur", "Milieu", "Attaquant"] as const;

export const ProfileSchema = z.object({
  id: z.number(), name: z.string(), role: z.enum(ROLES), description: z.string(),
  weights: z.record(z.string(), z.number()), max_age: z.number().nullable(), min_overall: z.number().nullable(),
});
const ContributionSchema = z.object({ key: z.string(), label: z.string(), value: z.number(), weight: z.number() });
export const CandidateSchema = z.object({
  id: z.string(), name: z.string(), kind: z.enum(["DFCO", "PROSPECT"]), age: z.number(), role: z.string(),
  position: z.string(), overall: z.number().nullable(), foot: z.string(), score: z.number(), rank: z.number(),
  eligible: z.boolean(), reasons: z.array(z.string()), strengths: z.array(ContributionSchema),
  weaknesses: z.array(ContributionSchema), delta_vs_squad: z.number().nullable(), fc27_url: z.string().nullable(),
  market_value: z.number(),
});
export const ShortlistSchema = z.object({
  profile: ProfileSchema, candidates: z.array(CandidateSchema),
  squad: z.array(z.object({ id: z.string(), name: z.string(), score: z.number(), overall: z.number().nullable() })),
  best_squad_score: z.number().nullable(),
});
export const SimilarSchema = z.object({
  id: z.string(), name: z.string(), kind: z.enum(["DFCO", "PROSPECT"]), age: z.number(), role: z.string(),
  position: z.string(), overall: z.number().nullable(), similarity: z.number(), market_value: z.number(),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInput = Omit<Profile, "id">;
export type Candidate = z.infer<typeof CandidateSchema>;
export type Shortlist = z.infer<typeof ShortlistSchema>;
export type Similar = z.infer<typeof SimilarSchema>;
