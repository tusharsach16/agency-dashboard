import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ActivityEvent } from "../types";

export function useActivityFeed(accessToken: string | null) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io("/", { auth: { token: accessToken } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("feed:catchup");
    });

    socket.on("feed:catchup:result", (missed: ActivityEvent[]) => {
      setEvents((prev) => [...missed.reverse(), ...prev]);
    });

    socket.on("feed:new", (event: ActivityEvent) => {
      setEvents((prev) => [event, ...prev]);
    });

    socket.on("presence:count", ({ count }: { count: number }) => {
      setOnlineCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  return { events, onlineCount };
}
