import { useState, useEffect, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getFeedSocket, releaseFeedSocket } from "../services/socket";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";
import { NotificationItem } from "../types";

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotifications();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!token) return;

    const socket = getFeedSocket(token);
    socketRef.current = socket;

    const handleNewNotif = (newNotif: NotificationItem) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
    };

    const handleUnreadCount = (data: { count: number }) => {
      if (typeof data?.count === "number") {
        setUnreadCount(data.count);
      }
    };

    socket.on("notification:new", handleNewNotif);
    socket.on("notification:unread_count", handleUnreadCount);

    return () => {
      socket.off("notification:new", handleNewNotif);
      socket.off("notification:unread_count", handleUnreadCount);
      releaseFeedSocket();
      socketRef.current = null;
    };
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await markNotificationAsRead(id);
    } catch {
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await markAllNotificationsAsRead();
    } catch {
      loadNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    reload: loadNotifications,
  };
}
