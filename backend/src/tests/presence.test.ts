import assert from "node:assert";
import { createServer } from "http";
import { io, Socket } from "socket.io-client";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { initSockets } from "../sockets";
import { presenceService } from "../services/presence.service";
import { signAccessToken } from "../utils/jwt";

async function runTests() {
  presenceService.clear();

  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm = await prisma.user.findFirstOrThrow({ where: { role: Role.PM } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { role: Role.DEVELOPER } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { role: Role.DEVELOPER, NOT: { id: dev1.id } } });

  const adminToken = signAccessToken(admin.id, admin.role);
  const pmToken = signAccessToken(pm.id, pm.role);
  const dev1Token = signAccessToken(dev1.id, dev1.role);
  const dev2Token = signAccessToken(dev2.id, dev2.role);
  const forgedToken = jwt.sign({ sub: dev1.id, role: Role.ADMIN }, "fake-secret-key");

  const httpServer = createServer();
  initSockets(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(0, "127.0.0.1", () => resolve());
  });

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const serverUrl = `http://127.0.0.1:${port}`;

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
  assert.ok(unauthConn.err);
  unauthConn.socket.disconnect();

  const forgedConn = await connectSocket(forgedToken);
  assert.ok(forgedConn.err);
  forgedConn.socket.disconnect();

  let adminReceivedCounts: number[] = [];
  const adminClient1 = io(serverUrl, {
    auth: { token: adminToken },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });

  adminClient1.on("presence:count", (data: { onlineCount: number }) => {
    adminReceivedCounts.push(data.onlineCount);
  });

  await new Promise<void>((resolve) => {
    adminClient1.on("connect", () => resolve());
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(adminReceivedCounts.length > 0, true);
  assert.strictEqual(adminReceivedCounts[0], 1);
  assert.strictEqual(presenceService.getOnlineUserCount(), 1);

  let pmReceivedPresence = false;
  let devReceivedPresence = false;

  const pmClient = io(serverUrl, {
    auth: { token: pmToken },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  pmClient.on("presence:count", () => {
    pmReceivedPresence = true;
  });

  await new Promise<void>((resolve) => {
    pmClient.on("connect", () => resolve());
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(pmReceivedPresence, false);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 2);
  assert.strictEqual(presenceService.getOnlineUserCount(), 2);

  const dev1Client1 = io(serverUrl, {
    auth: { token: dev1Token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });
  dev1Client1.on("presence:count", () => {
    devReceivedPresence = true;
  });

  await new Promise<void>((resolve) => {
    dev1Client1.on("connect", () => resolve());
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(devReceivedPresence, false);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 3);
  assert.strictEqual(presenceService.getOnlineUserCount(), 3);

  const dev1Client2 = io(serverUrl, {
    auth: { token: dev1Token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });

  await new Promise<void>((resolve) => {
    dev1Client2.on("connect", () => resolve());
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(presenceService.getOnlineUserCount(), 3);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 3);

  dev1Client1.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(presenceService.getOnlineUserCount(), 3);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 3);

  dev1Client2.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(presenceService.getOnlineUserCount(), 2);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 2);

  const dev2Client = io(serverUrl, {
    auth: { token: dev2Token },
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
  });

  await new Promise<void>((resolve) => {
    dev2Client.on("connect", () => resolve());
  });

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(presenceService.getOnlineUserCount(), 3);
  assert.strictEqual(adminReceivedCounts[adminReceivedCounts.length - 1], 3);

  pmClient.disconnect();
  dev2Client.disconnect();
  adminClient1.disconnect();

  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.strictEqual(presenceService.getOnlineUserCount(), 0);

  httpServer.close();
  await prisma.$disconnect();
}

runTests()
  .then(() => {
    console.log("All Presence & WebSocket Online State tests PASSED successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
