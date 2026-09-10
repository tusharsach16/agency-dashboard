import { z } from "zod";

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Client name is required"),
    contact: z.string().optional().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const getClientSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
