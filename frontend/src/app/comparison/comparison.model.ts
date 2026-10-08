import { z } from "zod";

export const MODES = ["young", "squad", "prospect"] as const;
export type ComparisonMode = (typeof MODES)[number];

export const PlayerLiteSchema = z.object({
  id: z.string(), name: z.string(), kind: z.enum(["DFCO", "PROSPECT"]), age: z.number(), role: z.string(),
  position: z.string(), overall: z.number().nullable(), goalkeeper: z.boolean(), ratings: z.record(z.string(), z.number()),
  market_value: z.number(),
});
export const CandidatesSchema = z.object({
  mode: z.enum(MODES), subjects: z.array(PlayerLiteSchema), references: z.array(PlayerLiteSchema), young_max_age: z.number(),
});
const GapSchema = z.object({
  key: z.string(), label: z.string(), group: z.string(), subject: z.number(), reference: z.number(), gap: z.number(),
  importance: z.number(), impact: z.number(),
});
const PhysicalSchema = z.object({
  weekly_load: z.number(), distance_km: z.number(), sprints: z.number(), max_speed: z.number(), minutes: z.number(),
});
export const ComparisonSchema = z.object({
  mode: z.enum(MODES), subject: PlayerLiteSchema, reference: PlayerLiteSchema, reference_auto: z.boolean(), similarity: z.number(),
  overall_gap: z.number().nullable(), value_gap: z.number(),
  groups: z.array(z.object({ key: z.string(), label: z.string(), subject: z.number(), reference: z.number(), gap: z.number() })),
  attributes: z.array(GapSchema),
  axes: z.array(z.object({ key: z.string(), label: z.string(), group: z.string(), gap: z.number(), subject: z.number(), reference: z.number(), advice: z.string() })),
  strengths: z.array(GapSchema),
  physical: z.object({ subject: PhysicalSchema, reference: PhysicalSchema }),
});

export type PlayerLite = z.infer<typeof PlayerLiteSchema>;
export type Candidates = z.infer<typeof CandidatesSchema>;
export type Comparison = z.infer<typeof ComparisonSchema>;
export type AttributeGap = z.infer<typeof GapSchema>;

/** Libellés de chaque lecture : qui est comparé, à qui, et comment lire le résultat. */
export const MODE_COPY: Record<ComparisonMode, {
  tab: string; description: string; subject: string; subjectShort: string; placeholder: string; reference: string; empty: string;
}> = {
  young: {
    tab: "Jeunes vs collectif",
    description: "Comparez un jeune du club (21 ans ou moins) au reste du collectif pour voir ses écarts et ses axes de progression.",
    subject: "Jeune du club", subjectShort: "Jeune", placeholder: "Choisir un jeune",
    reference: "Joueur du collectif",
    empty: "La référence est proposée automatiquement : le joueur du collectif, au même poste, dont le style est le plus proche.",
  },
  squad: {
    tab: "Collectif",
    description: "Comparez deux joueurs de l'effectif au même poste : niveau, style, physique et valeur.",
    subject: "Joueur de l'effectif", subjectShort: "Joueur", placeholder: "Choisir un joueur",
    reference: "Joueur comparé",
    empty: "La référence est proposée automatiquement : un coéquipier du même poste, de niveau au moins égal, au style le plus proche.",
  },
  prospect: {
    tab: "Prospect vs collectif",
    description: "Situez un prospect face au joueur du collectif qu'il concurrencerait : apport sur le terrain et différence de prix.",
    subject: "Prospect", subjectShort: "Prospect", placeholder: "Choisir un prospect",
    reference: "Joueur du collectif",
    empty: "La référence est proposée automatiquement : le joueur du collectif, au même poste, dont le style est le plus proche.",
  },
};
