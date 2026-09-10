import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { AuthedSocket } from "../types/activity";
import { socketAuthMiddleware } from "./auth.socket";
import { joinUserRooms, registerProjectRoomHandlers } from "./project-room.socket";
import { registerActivityHandlers } from "./activity.socket";

let ioInstance: Server | null = null;

export function getIO(): Server | null {
  return ioInstance;
}

export function initSockets(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: "*", credentials: true },
  });

  ioInstance = io;

  io.use(socketAuthMiddleware);

  io.on("connection", async (socket: AuthedSocket) => {
    await joinUserRooms(socket);
    registerProjectRoomHandlers(socket);
    registerActivityHandlers(socket);
  });

  return io;
}
