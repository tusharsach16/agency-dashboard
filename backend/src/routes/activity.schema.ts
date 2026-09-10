import { z } from "zod";

export const listActivitySchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
  }).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
