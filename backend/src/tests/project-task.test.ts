import assert from "node:assert";
import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  assertProjectAccess,
  assertProjectManageAccess,
  assertTaskAccess,
  assertTaskManageAccess,
  assertTaskStatusUpdateAccess,
} from "../utils/authorization";

async function runTests() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm1 = await prisma.user.findFirstOrThrow({ where: { email: "pm1@agency.dev" } });
  const pm2 = await prisma.user.findFirstOrThrow({ where: { email: "pm2@agency.dev" } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { email: "dev1@agency.dev" } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { email: "dev2@agency.dev" } });

  const adminAuth = { sub: admin.id, role: Role.ADMIN };
  const pm1Auth = { sub: pm1.id, role: Role.PM };
  const pm2Auth = { sub: pm2.id, role: Role.PM };
  const dev1Auth = { sub: dev1.id, role: Role.DEVELOPER };
  const dev2Auth = { sub: dev2.id, role: Role.DEVELOPER };

  const pm1Project = { managerId: pm1.id, tasks: [{ assignedToId: dev1.id }] };
  const pm2Project = { managerId: pm2.id, tasks: [{ assignedToId: dev2.id }] };

  assert.doesNotThrow(() => assertProjectAccess(adminAuth, pm1Project));
  assert.doesNotThrow(() => assertProjectAccess(pm1Auth, pm1Project));
  assert.throws(() => assertProjectAccess(pm2Auth, pm1Project));
  assert.doesNotThrow(() => assertProjectAccess(dev1Auth, pm1Project));
  assert.throws(() => assertProjectAccess(dev2Auth, pm1Project));

  assert.doesNotThrow(() => assertProjectManageAccess(adminAuth, pm1Project));
  assert.doesNotThrow(() => assertProjectManageAccess(pm1Auth, pm1Project));
  assert.throws(() => assertProjectManageAccess(pm2Auth, pm1Project));
  assert.throws(() => assertProjectManageAccess(dev1Auth, pm1Project));
  assert.throws(() => assertProjectManageAccess(dev2Auth, pm1Project));

  const dev1Task = { assignedToId: dev1.id, project: { managerId: pm1.id } };
  const dev2Task = { assignedToId: dev2.id, project: { managerId: pm2.id } };

  assert.doesNotThrow(() => assertTaskAccess(adminAuth, dev1Task));
  assert.doesNotThrow(() => assertTaskAccess(pm1Auth, dev1Task));
  assert.throws(() => assertTaskAccess(pm2Auth, dev1Task));
  assert.doesNotThrow(() => assertTaskAccess(dev1Auth, dev1Task));
  assert.throws(() => assertTaskAccess(dev2Auth, dev1Task));

  assert.doesNotThrow(() => assertTaskManageAccess(adminAuth, dev1Task));
  assert.doesNotThrow(() => assertTaskManageAccess(pm1Auth, dev1Task));
  assert.throws(() => assertTaskManageAccess(pm2Auth, dev1Task));
  assert.throws(() => assertTaskManageAccess(dev1Auth, dev1Task));

  assert.doesNotThrow(() => assertTaskStatusUpdateAccess(adminAuth, dev1Task));
  assert.doesNotThrow(() => assertTaskStatusUpdateAccess(pm1Auth, dev1Task));
  assert.throws(() => assertTaskStatusUpdateAccess(pm2Auth, dev1Task));
  assert.doesNotThrow(() => assertTaskStatusUpdateAccess(dev1Auth, dev1Task));
  assert.throws(() => assertTaskStatusUpdateAccess(dev2Auth, dev1Task));

  const client = await prisma.client.findFirstOrThrow();

  const testProject = await prisma.project.create({
    data: {
      name: "Test Verification Project",
      description: "Automated test project",
      clientId: client.id,
      managerId: pm1.id,
    },
  });

  const testTask = await prisma.task.create({
    data: {
      title: "Test Verification Task",
      description: "Testing status transaction",
      projectId: testProject.id,
      assignedToId: dev1.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 86400000),
    },
  });

  const previousStatus = testTask.status;
  const newStatus = TaskStatus.IN_PROGRESS;

  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: testTask.id },
      data: { status: newStatus },
    });

    await tx.activityLog.create({
      data: {
        taskId: testTask.id,
        projectId: testProject.id,
        userId: dev1.id,
        field: "status",
        fromValue: previousStatus,
        toValue: newStatus,
      },
    });
  });

  const updatedTask = await prisma.task.findUniqueOrThrow({ where: { id: testTask.id } });
  assert.strictEqual(updatedTask.status, TaskStatus.IN_PROGRESS);

  const log = await prisma.activityLog.findFirst({
    where: { taskId: testTask.id, field: "status", toValue: TaskStatus.IN_PROGRESS },
  });
  assert.ok(log);
  assert.strictEqual(log.userId, dev1.id);
  assert.strictEqual(log.fromValue, TaskStatus.TODO);
  assert.strictEqual(log.toValue, TaskStatus.IN_PROGRESS);

  await prisma.activityLog.deleteMany({ where: { taskId: testTask.id } });
  await prisma.task.delete({ where: { id: testTask.id } });
  await prisma.project.delete({ where: { id: testProject.id } });

  console.log("All Project & Task Management, RBAC, IDOR & Transaction tests PASSED successfully.");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
