import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { NotificationPayload, NotificationWithTask } from "../types/notification";
import { ApiError } from "../utils/ApiError";

export function formatNotificationPayload(notification: NotificationWithTask): NotificationPayload {
  return {
    id: notification.id,
    userId: notification.userId,
    taskId: notification.taskId,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    task: notification.task
      ? {
          id: notification.task.id,
          title: notification.task.title,
          projectId: notification.task.projectId,
        }
      : null,
  };
}

export async function getUserNotifications(userId: string): Promise<NotificationPayload[]> {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: {
      task: {
        select: { id: true, title: true, projectId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map(formatNotificationPayload);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function createNotification(
  db: Prisma.TransactionClient | typeof prisma,
  data: {
    userId: string;
    taskId?: string | null;
    message: string;
  }
): Promise<NotificationPayload> {
  const created = await db.notification.create({
    data: {
      userId: data.userId,
      taskId: data.taskId ?? null,
      message: data.message,
    },
    include: {
      task: {
        select: { id: true, title: true, projectId: true },
      },
    },
  });

  return formatNotificationPayload(created);
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<NotificationPayload> {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      task: {
        select: { id: true, title: true, projectId: true },
      },
    },
  });

  if (!existing) {
    throw ApiError.notFound("Notification not found");
  }

  if (existing.userId !== userId) {
    throw ApiError.forbidden("You do not have access to this notification");
  }

  if (existing.isRead) {
    return formatNotificationPayload(existing);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    include: {
      task: {
        select: { id: true, title: true, projectId: true },
      },
    },
  });

  return formatNotificationPayload(updated);
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { count: result.count };
}
