import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { ActivityEvent } from "../types";
import { api } from "../services/api";
import { getFeedSocket, releaseFeedSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

export function useActivityFeed(
  projectId?: string | null,
  onActivity?: (event: ActivityEvent) => void
) {
  const { token } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      setConnected(false);
      setLoading(false);
      return;
    }

    async function loadCatchup() {
      try {
        setLoading(true);
        const url = projectId ? `/activity?projectId=${projectId}` : "/activity";
        const res = await api.get(url);
        if (isMounted) {
          setEvents(res.data.activities ?? []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.error?.message || "Failed to load activity history");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCatchup();

    const socket = getFeedSocket(token);
    socketRef.current = socket;

    const handleConnect = () => {
      if (isMounted) {
        setConnected(true);
        setError(null);
      }

      if (projectId && socket.connected) {
        socket.emit(
          "feed:subscribe:project",
          { projectId },
          (res?: { success: boolean; error?: string }) => {
            if (res && !res.success && isMounted) {
              setError(res.error || "Failed to subscribe to project feed");
            }
          }
        );
      }
    };

    const handlePresence = (data: { onlineCount: number }) => {
      if (isMounted && typeof data?.onlineCount === "number") {
        setOnlineCount(data.onlineCount);
      }
    };

    const handleNewFeed = (event: ActivityEvent) => {
      if (!isMounted) return;
      if (projectId && event.projectId !== projectId) return;

      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) {
          return prev;
        }
        return [event, ...prev];
      });

      onActivityRef.current?.(event);
    };

    const handleDisconnect = () => {
      if (isMounted) {
        setConnected(false);
      }
    };

    const handleConnectError = (err: any) => {
      if (isMounted) {
        setConnected(false);
        setError(err?.message || "WebSocket connection error");
      }
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    socket.on("presence:count", handlePresence);
    socket.on("feed:new", handleNewFeed);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      isMounted = false;
      if (projectId && socket.connected) {
        socket.emit("feed:unsubscribe:project", { projectId });
      }
      socket.off("connect", handleConnect);
      socket.off("presence:count", handlePresence);
      socket.off("feed:new", handleNewFeed);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      releaseFeedSocket();
      socketRef.current = null;
    };
  }, [projectId, token]);

  return { events, connected, loading, error, onlineCount };
}
