import { z } from "zod";

export const markNotificationAsReadSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Notification ID is required"),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});
