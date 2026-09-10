import assert from "node:assert";
import { createServer } from "http";
import { io, Socket } from "socket.io-client";
import { Role, TaskStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { initSockets } from "../sockets";
import { getAuthorizedActivities } from "../services/activity.service";
import { broadcastActivityEvent } from "../services/activity-broadcast.service";
import { signAccessToken } from "../utils/jwt";

async function runTests() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm1 = await prisma.user.findFirstOrThrow({ where: { email: "pm1@agency.dev" } });
  const pm2 = await prisma.user.findFirstOrThrow({ where: { email: "pm2@agency.dev" } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { email: "dev1@agency.dev" } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { email: "dev2@agency.dev" } });

  const client = await prisma.client.findFirstOrThrow();

  const isolatedProject = await prisma.project.create({
    data: {
      name: "Dev1 Isolated Project",
      clientId: client.id,
      managerId: pm1.id,
    },
  });

  const dev1Task = await prisma.task.create({
    data: {
      title: "Dev1 Only Task",
      status: TaskStatus.TODO,
      projectId: isolatedProject.id,
      assignedToId: dev1.id,
    },
  });

  const pm1Project = isolatedProject;
  const pm2Project = await prisma.project.findFirstOrThrow({ where: { managerId: pm2.id } });

  const httpServer = createServer();
  initSockets(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const serverUrl = `http://127.0.0.1:${port}`;

  const adminToken = signAccessToken(admin.id, admin.role);
  const pm1Token = signAccessToken(pm1.id, pm1.role);
  const pm2Token = signAccessToken(pm2.id, pm2.role);
  const dev1Token = signAccessToken(dev1.id, dev1.role);
  const dev2Token = signAccessToken(dev2.id, dev2.role);

  const expiredToken = jwt.sign({ sub: dev1.id, role: dev1.role }, env.jwt.accessSecret, {
    expiresIn: "-1s",
  });
  const forgedToken = jwt.sign({ sub: dev1.id, role: Role.ADMIN }, "wrong-secret-key-12345");

  function connectSocket(token?: string): Promise<{ socket: Socket; err?: any }> {
    return new Promise((resolve) => {
      const socket = io(serverUrl, {
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

  const unauthConn = await connectSocket();
  assert.ok(unauthConn.err, "Unauthenticated socket connection must be rejected");
  unauthConn.socket.disconnect();

  const invalidTokenConn = await connectSocket(forgedToken);
  assert.ok(invalidTokenConn.err, "Invalid JWT token must be rejected");
  invalidTokenConn.socket.disconnect();

  const expiredTokenConn = await connectSocket(expiredToken);
  assert.ok(expiredTokenConn.err, "Expired JWT token must be rejected");
  expiredTokenConn.socket.disconnect();

  const adminConn = await connectSocket(adminToken);
  assert.ok(!adminConn.err, "Admin socket must connect successfully");

  const pm1Conn = await connectSocket(pm1Token);
  assert.ok(!pm1Conn.err, "PM1 socket must connect successfully");

  const pm2Conn = await connectSocket(pm2Token);
  assert.ok(!pm2Conn.err, "PM2 socket must connect successfully");

  const dev1Conn = await connectSocket(dev1Token);
  assert.ok(!dev1Conn.err, "Dev1 socket must connect successfully");

  const dev2Conn = await connectSocket(dev2Token);
  assert.ok(!dev2Conn.err, "Dev2 socket must connect successfully");

  const pm2SubPm1Proj = await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const timer = setTimeout(() => resolve({ success: false, error: "timeout" }), 1500);
    pm2Conn.socket.emit("feed:subscribe:project", { projectId: pm1Project.id }, (res: any) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
  assert.strictEqual(pm2SubPm1Proj.success, false, "PM2 must not subscribe to PM1 project");

  const dev2SubPm1Proj = await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const timer = setTimeout(() => resolve({ success: false, error: "timeout" }), 1500);
    dev2Conn.socket.emit("feed:subscribe:project", { projectId: pm1Project.id }, (res: any) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
  assert.strictEqual(dev2SubPm1Proj.success, false, "Dev2 must not subscribe to unauthorized project");

  const pm1SubPm1Proj = await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const timer = setTimeout(() => resolve({ success: false, error: "timeout" }), 1500);
    pm1Conn.socket.emit("feed:subscribe:project", { projectId: pm1Project.id }, (res: any) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
  assert.strictEqual(pm1SubPm1Proj.success, true, "PM1 must be able to subscribe to owned project");

  const dev1SubPm1Proj = await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const timer = setTimeout(() => resolve({ success: false, error: "timeout" }), 1500);
    dev1Conn.socket.emit("feed:subscribe:project", { projectId: pm1Project.id }, (res: any) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
  assert.strictEqual(dev1SubPm1Proj.success, true, "Dev1 must be able to subscribe to assigned project");

  const adminSubPm1Proj = await new Promise<{ success: boolean; error?: string }>((resolve) => {
    const timer = setTimeout(() => resolve({ success: false, error: "timeout" }), 1500);
    adminConn.socket.emit("feed:subscribe:project", { projectId: pm1Project.id }, (res: any) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
  assert.strictEqual(adminSubPm1Proj.success, true, "Admin must be able to subscribe to any project");

  const adminReceivedEvents: any[] = [];
  const pm1ReceivedEvents: any[] = [];
  const pm2ReceivedEvents: any[] = [];
  const dev1ReceivedEvents: any[] = [];
  const dev2ReceivedEvents: any[] = [];

  adminConn.socket.on("feed:new", (e) => adminReceivedEvents.push(e));
  pm1Conn.socket.on("feed:new", (e) => pm1ReceivedEvents.push(e));
  pm2Conn.socket.on("feed:new", (e) => pm2ReceivedEvents.push(e));
  dev1Conn.socket.on("feed:new", (e) => dev1ReceivedEvents.push(e));
  dev2Conn.socket.on("feed:new", (e) => dev2ReceivedEvents.push(e));

  const testEventId = "test-evt-" + Date.now();
  broadcastActivityEvent(pm1Project.id, {
    id: testEventId,
    taskId: dev1Task.id,
    projectId: pm1Project.id,
    userId: dev1.id,
    user: { id: dev1.id, name: dev1.name },
    task: { id: dev1Task.id, title: dev1Task.title },
    project: { id: pm1Project.id, name: pm1Project.name },
    field: "status",
    fromValue: "TODO",
    toValue: "IN_PROGRESS",
    createdAt: new Date().toISOString(),
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.ok(adminReceivedEvents.some((e) => e.id === testEventId), "Admin must receive broadcast activity");
  assert.ok(pm1ReceivedEvents.some((e) => e.id === testEventId), "PM1 must receive project activity");
  assert.ok(dev1ReceivedEvents.some((e) => e.id === testEventId), "Dev1 must receive project activity");
  assert.ok(!pm2ReceivedEvents.some((e) => e.id === testEventId), "PM2 must NOT receive other PM project activity");
  assert.ok(!dev2ReceivedEvents.some((e) => e.id === testEventId), "Dev2 must NOT receive unrelated project activity");

  const initialTaskState = await prisma.task.findUniqueOrThrow({ where: { id: dev1Task.id } });
  const initialLogCount = await prisma.activityLog.count({ where: { taskId: dev1Task.id } });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: dev1Task.id },
        data: { status: TaskStatus.DONE },
      });

      throw new Error("Simulated database failure during activity logging");
    });
  } catch {
  }

  const postRollbackTask = await prisma.task.findUniqueOrThrow({ where: { id: dev1Task.id } });
  const postRollbackLogCount = await prisma.activityLog.count({ where: { taskId: dev1Task.id } });

  assert.strictEqual(postRollbackTask.status, initialTaskState.status, "Task status must roll back on transaction failure");
  assert.strictEqual(postRollbackLogCount, initialLogCount, "ActivityLog must not persist on transaction failure");

  const { log: committedLog } = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: dev1Task.id },
      data: { status: TaskStatus.IN_PROGRESS },
    });

    const l = await tx.activityLog.create({
      data: {
        taskId: dev1Task.id,
        projectId: pm1Project.id,
        userId: dev1.id,
        field: "status",
        fromValue: initialTaskState.status,
        toValue: TaskStatus.IN_PROGRESS,
      },
    });

    return { updatedTask: updated, log: l };
  });

  broadcastActivityEvent(pm1Project.id, {
    id: committedLog.id,
    taskId: dev1Task.id,
    projectId: pm1Project.id,
    userId: dev1.id,
    user: { id: dev1.id, name: dev1.name },
    task: { id: dev1Task.id, title: dev1Task.title },
    project: { id: pm1Project.id, name: pm1Project.name },
    field: "status",
    fromValue: initialTaskState.status,
    toValue: TaskStatus.IN_PROGRESS,
    createdAt: committedLog.createdAt.toISOString(),
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.ok(adminReceivedEvents.some((e) => e.id === committedLog.id), "Committed event emitted to Admin");
  assert.ok(pm1ReceivedEvents.some((e) => e.id === committedLog.id), "Committed event emitted to PM1");
  assert.ok(dev1ReceivedEvents.some((e) => e.id === committedLog.id), "Committed event emitted to Dev1");

  const adminCatchup = await getAuthorizedActivities({ sub: admin.id, role: Role.ADMIN });
  assert.ok(adminCatchup.length > 0 && adminCatchup.length <= 20, "Admin catchup returns <= 20 records");

  const pm1Catchup = await getAuthorizedActivities({ sub: pm1.id, role: Role.PM });
  assert.ok(pm1Catchup.every((a) => a.projectId === pm1Project.id || a.projectId !== pm2Project.id), "PM1 catchup only contains owned project activity");

  const dev1Catchup = await getAuthorizedActivities({ sub: dev1.id, role: Role.DEVELOPER });
  assert.ok(dev1Catchup.length > 0 && dev1Catchup.length <= 20, "Dev1 catchup returns <= 20 records");

  await assert.rejects(
    async () => {
      await getAuthorizedActivities({ sub: dev2.id, role: Role.DEVELOPER }, isolatedProject.id);
    },
    (err: any) => err.statusCode === 403,
    "Dev2 catchup on unauthorized project throws 403"
  );

  adminConn.socket.disconnect();
  pm1Conn.socket.disconnect();
  pm2Conn.socket.disconnect();
  dev1Conn.socket.disconnect();
  dev2Conn.socket.disconnect();

  await new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });

  await prisma.activityLog.deleteMany({ where: { projectId: isolatedProject.id } });
  await prisma.task.deleteMany({ where: { projectId: isolatedProject.id } });
  await prisma.project.deleteMany({ where: { id: isolatedProject.id } });

  console.log("All Real-Time Activity Feed, WebSocket RBAC, IDOR, Transaction & Offline Catchup tests PASSED successfully.");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
