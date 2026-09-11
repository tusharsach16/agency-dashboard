import { io, Socket } from "socket.io-client";

let sharedSocket: Socket | null = null;
let activeToken: string | null = null;
let refCount = 0;
let disconnectTimer: any = null;

export function getFeedSocket(token: string): Socket {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  if (!sharedSocket || activeToken !== token) {
    if (sharedSocket) {
      try {
        sharedSocket.disconnect();
      } catch {
        // ignore
      }
    }
    activeToken = token;
    const socketUrl = import.meta.env.VITE_SOCKET_URL ?? "/";
    sharedSocket = io(socketUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
  } else if (!sharedSocket.connected) {
    sharedSocket.connect();
  }

  refCount++;
  return sharedSocket;
}

export function releaseFeedSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && sharedSocket) {
    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
    }
    disconnectTimer = setTimeout(() => {
      if (refCount === 0 && sharedSocket) {
        try {
          sharedSocket.disconnect();
        } catch {
          // ignore
        }
        sharedSocket = null;
        activeToken = null;
      }
    }, 400);
  }
}

export function createFeedSocket(token: string): Socket {
  return getFeedSocket(token);
}
