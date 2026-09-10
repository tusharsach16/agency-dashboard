import { Notification } from "@prisma/client";

export interface NotificationWithTask extends Notification {
  task?: {
    id: string;
    title: string;
    projectId: string;
  } | null;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  taskId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    projectId: string;
  } | null;
}

export interface UnreadCountPayload {
  count: number;
}
