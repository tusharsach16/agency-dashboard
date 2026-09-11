import { Server } from "socket.io";
import { Role } from "@prisma/client";
import { AuthedSocket } from "../types/activity";
import { presenceService } from "../services/presence.service";

export const PRESENCE_ADMIN_ROOM = "presence:admin";
export const PRESENCE_COUNT_EVENT = "presence:count";

export function registerPresenceHandlers(io: Server, socket: AuthedSocket): void {
  const user = socket.user;
  if (!user) return;

  const isAdmin = user.role === Role.ADMIN;
  if (isAdmin) {
    socket.join(PRESENCE_ADMIN_ROOM);
  }

  const { countChanged, currentCount } = presenceService.addSocket(user.sub, socket.id);

  if (isAdmin) {
    socket.emit(PRESENCE_COUNT_EVENT, { onlineCount: currentCount });
    if (countChanged) {
      socket.to(PRESENCE_ADMIN_ROOM).emit(PRESENCE_COUNT_EVENT, { onlineCount: currentCount });
    }
  } else if (countChanged) {
    io.to(PRESENCE_ADMIN_ROOM).emit(PRESENCE_COUNT_EVENT, { onlineCount: currentCount });
  }

  socket.on("disconnect", () => {
    const { countChanged: disconnectedCountChanged, currentCount: updatedCount } =
      presenceService.removeSocket(user.sub, socket.id);

    if (disconnectedCountChanged) {
      io.to(PRESENCE_ADMIN_ROOM).emit(PRESENCE_COUNT_EVENT, { onlineCount: updatedCount });
    }
  });
}
