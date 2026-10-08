import { z } from "zod";

export const ErrorSchema = z.object({
  user_safe_title: z.string(),
  user_safe_description: z.string(),
  dev: z.string(),
});

export type ApiError = z.infer<typeof ErrorSchema>;
