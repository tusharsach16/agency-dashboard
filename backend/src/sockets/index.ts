import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/prisma";

interface AuthedSocket extends Socket {
  user?: { sub: string; role: Role };
}

const onlineUsers = new Map<string, number>();

export function initSockets(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = verifyAccessToken(token);
      socket.user = { sub: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const user = socket.user!;

    onlineUsers.set(user.sub, (onlineUsers.get(user.sub) ?? 0) + 1);
    io.emit("presence:count", { count: onlineUsers.size });

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

    socket.on("feed:catchup", async () => {
      const events = await fetchCatchupEvents(user);
      socket.emit("feed:catchup:result", events);
    });

    socket.on("disconnect", () => {
      const remaining = (onlineUsers.get(user.sub) ?? 1) - 1;
      if (remaining <= 0) {
        onlineUsers.delete(user.sub);
      } else {
        onlineUsers.set(user.sub, remaining);
      }
      io.emit("presence:count", { count: onlineUsers.size });
    });
  });

  return io;
}

async function fetchCatchupEvents(user: { sub: string; role: Role }) {
  if (user.role === Role.ADMIN) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: true, task: true },
    });
  }

  if (user.role === Role.PM) {
    return prisma.activityLog.findMany({
      where: { project: { managerId: user.sub } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: true, task: true },
    });
  }

  return prisma.activityLog.findMany({
    where: { task: { assignedToId: user.sub } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true, task: true },
  });
}

export function broadcastActivity(
  io: Server,
  projectId: string,
  event: Record<string, unknown>
) {
  io.to("feed:global").to(`feed:project:${projectId}`).emit("feed:new", event);
}
