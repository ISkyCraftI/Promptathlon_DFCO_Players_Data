import { z } from "zod";

export const CatalogSchema = z.object({
  roles: z.array(z.string()),
  groups: z.array(z.object({
    key: z.string(), label: z.string(), short: z.string(),
    attributes: z.array(z.object({ key: z.string(), label: z.string() })),
  })),
  role_weights: z.record(z.string(), z.record(z.string(), z.number())),
  young_max_age: z.number(),
  load_zones: z.array(z.object({ key: z.string(), label: z.string(), min: z.number(), max: z.number() })),
});
export type Catalog = z.infer<typeof CatalogSchema>;
