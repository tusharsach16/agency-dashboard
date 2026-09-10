import { getIO } from "../sockets";
import { NotificationPayload } from "../types/notification";

export function broadcastNotificationToUser(userId: string, notification: NotificationPayload): void {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:new", notification);
}

export function broadcastUnreadCountToUser(userId: string, count: number): void {
  const io = getIO();
  if (!io) return;
  io.to(`user:${userId}`).emit("notification:unread_count", { count });
}
