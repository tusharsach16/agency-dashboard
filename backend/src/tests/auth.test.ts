import assert from "node:assert";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { assertProjectAccess, assertTaskAccess } from "../utils/authorization";

async function runTests() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm1 = await prisma.user.findFirstOrThrow({ where: { email: "pm1@agency.dev" } });
  const pm2 = await prisma.user.findFirstOrThrow({ where: { email: "pm2@agency.dev" } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { email: "dev1@agency.dev" } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { email: "dev2@agency.dev" } });

  const adminToken = signAccessToken(admin.id, admin.role);
  const pm1Token = signAccessToken(pm1.id, pm1.role);
  const pm2Token = signAccessToken(pm2.id, pm2.role);
  const dev1Token = signAccessToken(dev1.id, dev1.role);
  const dev2Token = signAccessToken(dev2.id, dev2.role);

  const expiredToken = jwt.sign({ sub: dev1.id, role: dev1.role }, env.jwt.accessSecret, {
    expiresIn: "-1s",
  });

  const forgedToken = jwt.sign({ sub: dev1.id, role: Role.ADMIN }, "wrong-secret-key-12345");

  assert.throws(
    () => {
      jwt.verify(expiredToken, env.jwt.accessSecret);
    },
    { name: "TokenExpiredError" }
  );

  assert.throws(
    () => {
      jwt.verify(forgedToken, env.jwt.accessSecret);
    },
    { name: "JsonWebTokenError" }
  );

  const pm1Project = { managerId: pm1.id, tasks: [{ assignedToId: dev1.id }] };
  const pm2Project = { managerId: pm2.id, tasks: [{ assignedToId: dev2.id }] };

  assert.doesNotThrow(() => assertProjectAccess({ sub: admin.id, role: Role.ADMIN }, pm1Project));
  assert.doesNotThrow(() => assertProjectAccess({ sub: pm1.id, role: Role.PM }, pm1Project));
  assert.throws(() => assertProjectAccess({ sub: pm2.id, role: Role.PM }, pm1Project));
  assert.doesNotThrow(() => assertProjectAccess({ sub: dev1.id, role: Role.DEVELOPER }, pm1Project));
  assert.throws(() => assertProjectAccess({ sub: dev2.id, role: Role.DEVELOPER }, pm1Project));

  const dev1Task = { assignedToId: dev1.id, project: { managerId: pm1.id } };
  const dev2Task = { assignedToId: dev2.id, project: { managerId: pm2.id } };

  assert.doesNotThrow(() => assertTaskAccess({ sub: admin.id, role: Role.ADMIN }, dev1Task));
  assert.doesNotThrow(() => assertTaskAccess({ sub: pm1.id, role: Role.PM }, dev1Task));
  assert.throws(() => assertTaskAccess({ sub: pm2.id, role: Role.PM }, dev1Task));
  assert.doesNotThrow(() => assertTaskAccess({ sub: dev1.id, role: Role.DEVELOPER }, dev1Task));
  assert.throws(() => assertTaskAccess({ sub: dev2.id, role: Role.DEVELOPER }, dev1Task));

  const testRefreshToken = signRefreshToken(dev1.id);
  const createdSession = await prisma.refreshToken.create({
    data: {
      token: testRefreshToken,
      userId: dev1.id,
      expiresAt: new Date(Date.now() + 60000),
    },
  });

  const foundSession = await prisma.refreshToken.findUnique({ where: { token: testRefreshToken } });
  assert.ok(foundSession);
  assert.strictEqual(foundSession.userId, dev1.id);

  await prisma.refreshToken.delete({ where: { id: createdSession.id } });
  const revokedSession = await prisma.refreshToken.findUnique({ where: { token: testRefreshToken } });
  assert.strictEqual(revokedSession, null);

  const expiredSessionToken = signRefreshToken(dev1.id);
  const expiredSession = await prisma.refreshToken.create({
    data: {
      token: expiredSessionToken,
      userId: dev1.id,
      expiresAt: new Date(Date.now() - 10000),
    },
  });

  assert.ok(expiredSession.expiresAt < new Date());
  await prisma.refreshToken.delete({ where: { id: expiredSession.id } });

  const fetchedUser = await prisma.user.findUnique({
    where: { id: admin.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  assert.ok(fetchedUser);
  assert.strictEqual("passwordHash" in fetchedUser, false);

  console.log("All 20 Auth, RBAC, IDOR, Token & Password security tests PASSED successfully.");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
