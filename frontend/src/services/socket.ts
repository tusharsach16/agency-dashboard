import { io, Socket } from "socket.io-client";

export function createFeedSocket(token: string): Socket {
  return io("/", {
    auth: { token },
    transports: ["websocket", "polling"],
  });
}
