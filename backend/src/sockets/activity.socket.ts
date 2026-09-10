import { AuthedSocket } from "../types/activity";
import { getAuthorizedActivities } from "../services/activity.service";

export function registerActivityHandlers(socket: AuthedSocket): void {
  const user = socket.user;
  if (!user) return;

  socket.on("feed:catchup", async (data?: { projectId?: string }) => {
    try {
      const events = await getAuthorizedActivities(user, data?.projectId);
      socket.emit("feed:catchup:result", events);
    } catch {
      socket.emit("feed:catchup:result", []);
    }
  });
}
