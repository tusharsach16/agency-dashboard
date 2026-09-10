import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(Role),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(Role),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

export const listUsersSchema = z.object({
  query: z.object({
    role: z.nativeEnum(Role).optional(),
  }).optional(),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
