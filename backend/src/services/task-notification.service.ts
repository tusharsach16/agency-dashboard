import { Prisma } from "@prisma/client";
import { NotificationPayload } from "../types/notification";
import { createNotification, getUnreadNotificationCount } from "./notification.service";
import {
  broadcastNotificationToUser,
  broadcastUnreadCountToUser,
} from "./notification-broadcast.service";

export async function createAssignmentNotification(
  tx: Prisma.TransactionClient,
  data: {
    assigneeId: string;
    taskId: string;
    taskTitle: string;
    actorId: string;
  }
): Promise<NotificationPayload | null> {
  if (!data.assigneeId || data.assigneeId === data.actorId) {
    return null;
  }

  return createNotification(tx, {
    userId: data.assigneeId,
    taskId: data.taskId,
    message: `You were assigned to task: ${data.taskTitle}`,
  });
}

export async function createStatusChangeNotification(
  tx: Prisma.TransactionClient,
  data: {
    recipientId: string;
    taskId: string;
    taskTitle: string;
    status: string;
    actorId: string;
  }
): Promise<NotificationPayload | null> {
  if (!data.recipientId || data.recipientId === data.actorId) {
    return null;
  }

  return createNotification(tx, {
    userId: data.recipientId,
    taskId: data.taskId,
    message: `Task "${data.taskTitle}" status changed to ${data.status}`,
  });
}

export async function broadcastTaskNotifications(
  notifications: (NotificationPayload | null)[]
): Promise<void> {
  for (const notif of notifications) {
    if (!notif) continue;
    const count = await getUnreadNotificationCount(notif.userId);
    broadcastNotificationToUser(notif.userId, notif);
    broadcastUnreadCountToUser(notif.userId, count);
  }
}
