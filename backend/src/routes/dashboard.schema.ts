import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const dashboardFilterQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    projectId: z.string().optional(),
    assignedToId: z.string().optional(),
  }),
});
