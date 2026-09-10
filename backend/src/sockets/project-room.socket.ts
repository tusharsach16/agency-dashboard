import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { assertProjectAccess } from "../utils/authorization";
import { AuthedSocket } from "../types/activity";

export async function joinUserRooms(socket: AuthedSocket): Promise<void> {
  const user = socket.user;
  if (!user) return;

  try {
    if (user.role === Role.ADMIN) {
      socket.join("feed:global");
    } else if (user.role === Role.PM) {
      const projects = await prisma.project.findMany({
        where: { managerId: user.sub },
        select: { id: true },
      });
      projects.forEach((p) => socket.join(`feed:project:${p.id}`));
    } else {
      const tasks = await prisma.task.findMany({
        where: { assignedToId: user.sub },
        select: { projectId: true },
      });
      const projectIds = [...new Set(tasks.map((t) => t.projectId))];
      projectIds.forEach((id) => socket.join(`feed:project:${id}`));
    }
  } catch {
  }
}

export function registerProjectRoomHandlers(socket: AuthedSocket): void {
  const user = socket.user;
  if (!user) return;

  socket.on(
    "feed:subscribe:project",
    async (
      data: { projectId: string },
      callback?: (res: { success: boolean; error?: string }) => void
    ) => {
      try {
        const { projectId } = data || {};
        if (!projectId) {
          if (callback) callback({ success: false, error: "Project ID is required" });
          return;
        }

        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: { select: { assignedToId: true } },
          },
        });

        if (!project) {
          if (callback) callback({ success: false, error: "Project not found" });
          return;
        }

        assertProjectAccess(user, project);
        socket.join(`feed:project:${projectId}`);
        if (callback) callback({ success: true });
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message || "Unauthorized" });
      }
    }
  );

  socket.on("feed:unsubscribe:project", (data: { projectId: string }) => {
    if (data?.projectId) {
      socket.leave(`feed:project:${data.projectId}`);
    }
  });
}
