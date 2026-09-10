import assert from "node:assert";
import { createServer } from "http";
import express from "express";
import cookieParser from "cookie-parser";
import { io, Socket } from "socket.io-client";
import { Role, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { initSockets } from "../sockets";
import { signAccessToken } from "../utils/jwt";
import routes from "../routes";
import { errorHandler } from "../middleware/errorHandler";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from "../services/notification.service";
import {
  broadcastNotificationToUser,
  broadcastUnreadCountToUser,
} from "../services/notification-broadcast.service";

async function runTests() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm1 = await prisma.user.findFirstOrThrow({ where: { email: "pm1@agency.dev" } });
  const pm2 = await prisma.user.findFirstOrThrow({ where: { email: "pm2@agency.dev" } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { email: "dev1@agency.dev" } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { email: "dev2@agency.dev" } });

  const client = await prisma.client.findFirstOrThrow();

  const testProject = await prisma.project.create({
    data: {
      name: "Feature 5 Test Project",
      clientId: client.id,
      managerId: pm1.id,
    },
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api", routes);
  app.use(errorHandler);

  const httpServer = createServer(app);
  initSockets(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  const adminToken = signAccessToken(admin.id, admin.role);
  const pm1Token = signAccessToken(pm1.id, pm1.role);
  const dev1Token = signAccessToken(dev1.id, dev1.role);
  const dev2Token = signAccessToken(dev2.id, dev2.role);

  function connectSocket(token?: string): Promise<{ socket: Socket; err?: any }> {
    return new Promise((resolve) => {
      const socket = io(baseUrl, {
        auth: token ? { token } : {},
        transports: ["websocket"],
        reconnection: false,
        timeout: 2000,
        forceNew: true,
      });

      socket.on("connect", () => {
        resolve({ socket });
      });

      socket.on("connect_error", (err) => {
        resolve({ socket, err });
      });
    });
  }

  const dev1Conn = await connectSocket(dev1Token);
  const dev2Conn = await connectSocket(dev2Token);
  const pm1Conn = await connectSocket(pm1Token);

  assert.ok(!dev1Conn.err, "Dev1 socket connected successfully");
  assert.ok(!dev2Conn.err, "Dev2 socket connected successfully");
  assert.ok(!pm1Conn.err, "PM1 socket connected successfully");

  const unauthRes = await fetch(`${baseUrl}/api/notifications`);
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated request to /api/notifications returns 401");

  const dev1NotifRecord = await prisma.notification.create({
    data: {
      userId: dev1.id,
      message: "Test Dev1 Private Notification",
    },
  });

  const dev2NotifRecord = await prisma.notification.create({
    data: {
      userId: dev2.id,
      message: "Test Dev2 Private Notification",
    },
  });

  const dev1ListRes = await fetch(`${baseUrl}/api/notifications`, {
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  assert.strictEqual(dev1ListRes.status, 200);
  const dev1ListData = (await dev1ListRes.json()) as any;
  assert.ok(dev1ListData.success);
  assert.ok(dev1ListData.notifications.some((n: any) => n.id === dev1NotifRecord.id));
  assert.ok(!dev1ListData.notifications.some((n: any) => n.id === dev2NotifRecord.id), "Dev1 must not see Dev2 notification");

  const dev2CrossAccessRes = await fetch(`${baseUrl}/api/notifications/${dev1NotifRecord.id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${dev2Token}` },
  });
  assert.strictEqual(dev2CrossAccessRes.status, 403, "Dev2 marking Dev1 notification returns 403");

  const dev1ReceivedNotifs: any[] = [];
  const dev2ReceivedNotifs: any[] = [];
  const dev1UnreadCounts: number[] = [];

  dev1Conn.socket.on("notification:new", (n) => dev1ReceivedNotifs.push(n));
  dev2Conn.socket.on("notification:new", (n) => dev2ReceivedNotifs.push(n));
  dev1Conn.socket.on("notification:unread_count", (data) => dev1UnreadCounts.push(data.count));

  const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pm1Token}`,
    },
    body: JSON.stringify({
      title: "Realtime Notification Task",
      projectId: testProject.id,
      assignedToId: dev1.id,
    }),
  });
  assert.strictEqual(createTaskRes.status, 201);
  const createdTaskData = (await createTaskRes.json()) as any;
  const createdTaskId = createdTaskData.task.id;

  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.ok(dev1ReceivedNotifs.some((n) => n.taskId === createdTaskId), "Dev1 received socket notification for assigned task");
  assert.ok(!dev2ReceivedNotifs.some((n) => n.taskId === createdTaskId), "Dev2 did NOT receive socket notification for Dev1 assigned task");
  assert.ok(dev1UnreadCounts.length > 0, "Dev1 received real-time unread count update");

  const createdNotifId = dev1ReceivedNotifs.find((n) => n.taskId === createdTaskId)?.id;
  assert.ok(createdNotifId, "Notification ID was emitted");

  const unreadBeforeMark = await getUnreadNotificationCount(dev1.id);
  const markReadRes = await fetch(`${baseUrl}/api/notifications/${createdNotifId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  assert.strictEqual(markReadRes.status, 200);
  const markReadData = (await markReadRes.json()) as any;
  assert.strictEqual(markReadData.notification.isRead, true);

  const unreadAfterMark = await getUnreadNotificationCount(dev1.id);
  assert.strictEqual(unreadAfterMark, unreadBeforeMark - 1, "Unread count decreased in database");

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.strictEqual(dev1UnreadCounts[dev1UnreadCounts.length - 1], unreadAfterMark, "Dev1 received socket unread count update after mark read");

  const initialNotifCount = await prisma.notification.count({ where: { userId: dev1.id } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: createdTaskId },
        data: { status: TaskStatus.DONE },
      });

      await createNotification(tx, {
        userId: dev1.id,
        taskId: createdTaskId,
        message: "Failed transaction notification",
      });

      throw new Error("Simulated failure in transaction");
    });
  } catch {
  }

  const postRollbackNotifCount = await prisma.notification.count({ where: { userId: dev1.id } });
  assert.strictEqual(postRollbackNotifCount, initialNotifCount, "Notification must roll back when transaction fails");

  const markAllRes = await fetch(`${baseUrl}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${dev1Token}` },
  });
  assert.strictEqual(markAllRes.status, 200);

  const finalUnreadCount = await getUnreadNotificationCount(dev1.id);
  assert.strictEqual(finalUnreadCount, 0, "Mark all as read resets unread count to 0 in database");

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.strictEqual(dev1UnreadCounts[dev1UnreadCounts.length - 1], 0, "Emitted unread count is 0 after mark-all-as-read");

  const dev1OfflineNotifs = await getUserNotifications(dev1.id);
  assert.ok(dev1OfflineNotifs.length >= 2, "Offline persisted notifications available in PostgreSQL");
  assert.ok(dev1OfflineNotifs.every((n) => n.isRead === true), "All persisted notifications are read");

  dev1Conn.socket.disconnect();
  dev2Conn.socket.disconnect();
  pm1Conn.socket.disconnect();

  await new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });

  await prisma.notification.deleteMany({ where: { userId: { in: [dev1.id, dev2.id, pm1.id, admin.id] } } });
  await prisma.task.deleteMany({ where: { projectId: testProject.id } });
  await prisma.project.deleteMany({ where: { id: testProject.id } });

  console.log("All Feature 5 Notification & Real-Time Unread Count tests PASSED successfully.");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
