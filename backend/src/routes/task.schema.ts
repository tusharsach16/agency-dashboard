import { z } from "zod";
import { TaskStatus, TaskPriority } from "@prisma/client";

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional().nullable(),
    projectId: z.string().min(1, "Project ID is required"),
    assignedToId: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
    assignedToId: z.string().optional().nullable(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

export const updateTaskStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TaskStatus),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

export const getTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listTasksSchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    assignedToId: z.string().optional(),
  }).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
