import { io, Socket } from "socket.io-client";

export function createFeedSocket(token: string): Socket {
  const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "/";
  return io(socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
}
