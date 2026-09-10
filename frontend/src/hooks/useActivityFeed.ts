import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { ActivityEvent } from "../types";
import { api } from "../services/api";
import { createFeedSocket } from "../services/socket";
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

    const socket = createFeedSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (isMounted) {
        setConnected(true);
        setError(null);
      }

      if (projectId) {
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
    });

    socket.on("feed:new", (event: ActivityEvent) => {
      if (!isMounted) return;
      if (projectId && event.projectId !== projectId) return;

      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) {
          return prev;
        }
        return [event, ...prev];
      });

      onActivityRef.current?.(event);
    });

    socket.on("disconnect", () => {
      if (isMounted) {
        setConnected(false);
      }
    });

    socket.on("connect_error", (err) => {
      if (isMounted) {
        setConnected(false);
        setError(err.message || "WebSocket connection error");
      }
    });

    return () => {
      isMounted = false;
      if (projectId) {
        socket.emit("feed:unsubscribe:project", { projectId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, token]);

  return { events, connected, loading, error };
}
