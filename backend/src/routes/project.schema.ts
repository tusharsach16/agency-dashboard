import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional().nullable(),
    clientId: z.string().min(1, "Client ID is required"),
    managerId: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    clientId: z.string().min(1).optional(),
    managerId: z.string().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

export const getProjectSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const deleteProjectSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
