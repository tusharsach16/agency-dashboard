import { api } from "./api";
import { NotificationItem, NotificationsResponse } from "../types";

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await api.get<NotificationsResponse>("/notifications");
  return res.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await api.get<{ success: boolean; count: number }>("/notifications/unread-count");
  return res.data.count;
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  const res = await api.patch<{ success: boolean; notification: NotificationItem }>(
    `/notifications/${id}/read`
  );
  return res.data.notification;
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const res = await api.patch<{ success: boolean; count: number }>("/notifications/read-all");
  return res.data.count;
}
