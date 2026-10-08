/**
 * EXAMPLE — feature CRUD de reference (desactivee).
 * Garder ce dossier comme template pour de nouvelles features.
 * Reactiver : decommenter la route dans app.routes.ts
 * et ajouter une entree dans shared/components/menu-bar.
 */

import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;

export const ItemCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().default(""),
});

export type ItemCreate = z.infer<typeof ItemCreateSchema>;
