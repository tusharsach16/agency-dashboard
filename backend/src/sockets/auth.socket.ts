import { ExtendedError } from "socket.io/dist/namespace";
import { verifyAccessToken } from "../utils/jwt";
import { AuthedSocket } from "../types/activity";

export function socketAuthMiddleware(
  socket: AuthedSocket,
  next: (err?: ExtendedError) => void
) {
  const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (!rawToken) {
    return next(new Error("Authentication required"));
  }

  const token = typeof rawToken === "string" && rawToken.startsWith("Bearer ")
    ? rawToken.slice(7)
    : rawToken;

  try {
    const payload = verifyAccessToken(token);
    socket.user = { sub: payload.sub, role: payload.role };
    next();
  } catch {
    next(new Error("Invalid or expired authentication token"));
  }
}
