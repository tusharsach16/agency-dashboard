import assert from "node:assert";
import { Role, TaskStatus, TaskPriority } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getDashboardStats, getFilteredDashboardData } from "../services/dashboard.service";

async function runTests() {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const pm1 = await prisma.user.findFirstOrThrow({ where: { email: "pm1@agency.dev" } });
  const pm2 = await prisma.user.findFirstOrThrow({ where: { email: "pm2@agency.dev" } });
  const dev1 = await prisma.user.findFirstOrThrow({ where: { email: "dev1@agency.dev" } });
  const dev2 = await prisma.user.findFirstOrThrow({ where: { email: "dev2@agency.dev" } });

  const client = await prisma.client.findFirstOrThrow();

  const pm1TestProject = await prisma.project.create({
    data: {
      name: "Dashboard Test PM1 Project",
      clientId: client.id,
      managerId: pm1.id,
    },
  });

  const pm2TestProject = await prisma.project.create({
    data: {
      name: "Dashboard Test PM2 Project",
      clientId: client.id,
      managerId: pm2.id,
    },
  });

  const overdueDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);

  const task1 = await prisma.task.create({
    data: {
      title: "Dev1 Task Overdue",
      projectId: pm1TestProject.id,
      assignedToId: dev1.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: overdueDate,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Dev1 Task Future",
      projectId: pm1TestProject.id,
      assignedToId: dev1.id,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: futureDate,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Dev2 Task Overdue",
      projectId: pm2TestProject.id,
      assignedToId: dev2.id,
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.CRITICAL,
      dueDate: overdueDate,
    },
  });

  const adminStats = await getDashboardStats({ sub: admin.id, role: Role.ADMIN });
  assert.ok(adminStats.totalProjects >= 2, "Admin sees all projects");
  assert.ok(adminStats.totalTasks >= 3, "Admin sees all tasks");
  assert.ok(adminStats.overdueTasks >= 2, "Admin sees global overdue count");

  const pm1Stats = await getDashboardStats({ sub: pm1.id, role: Role.PM });
  assert.ok(pm1Stats.totalProjects >= 1, "PM1 stats reflect owned projects");
  assert.ok(pm1Stats.totalTasks >= 2, "PM1 stats reflect owned tasks");

  const dev1Stats = await getDashboardStats({ sub: dev1.id, role: Role.DEVELOPER });
  assert.ok(dev1Stats.totalTasks >= 2, "Dev1 stats reflect assigned tasks");
  assert.ok(dev1Stats.overdueTasks >= 1, "Dev1 overdue count includes assigned overdue tasks");

  const dev1Data = await getFilteredDashboardData(
    { sub: dev1.id, role: Role.DEVELOPER },
    {}
  );
  assert.ok(dev1Data.tasks.every((t) => t.assignedToId === dev1.id), "Dev1 only receives assigned tasks");

  await assert.rejects(
    async () => {
      await getFilteredDashboardData(
        { sub: dev1.id, role: Role.DEVELOPER },
        { assignedToId: dev2.id }
      );
    },
    (err: any) => err.statusCode === 403,
    "Dev1 cannot override assignedToId to access Dev2 tasks"
  );

  const pm1Data = await getFilteredDashboardData(
    { sub: pm1.id, role: Role.PM },
    { projectId: pm1TestProject.id }
  );
  assert.strictEqual(pm1Data.tasks.length, 2, "PM1 accesses own project tasks");

  await assert.rejects(
    async () => {
      await getFilteredDashboardData(
        { sub: pm1.id, role: Role.PM },
        { projectId: pm2TestProject.id }
      );
    },
    (err: any) => err.statusCode === 403,
    "PM1 cannot query another PM's project"
  );

  const statusFiltered = await getFilteredDashboardData(
    { sub: admin.id, role: Role.ADMIN },
    { status: TaskStatus.IN_PROGRESS, projectId: pm1TestProject.id }
  );
  assert.strictEqual(statusFiltered.tasks.length, 1, "Status filter correctly filters tasks");
  assert.strictEqual(statusFiltered.tasks[0].id, task1.id);

  const priorityFiltered = await getFilteredDashboardData(
    { sub: admin.id, role: Role.ADMIN },
    { priority: TaskPriority.LOW, projectId: pm1TestProject.id }
  );
  assert.strictEqual(priorityFiltered.tasks.length, 1, "Priority filter correctly filters tasks");
  assert.strictEqual(priorityFiltered.tasks[0].id, task2.id);

  const combinedFiltered = await getFilteredDashboardData(
    { sub: admin.id, role: Role.ADMIN },
    {
      projectId: pm1TestProject.id,
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
    }
  );
  assert.strictEqual(combinedFiltered.tasks.length, 1, "Combined filters return exact match");

  await prisma.task.deleteMany({
    where: { id: { in: [task1.id, task2.id, task3.id] } },
  });
  await prisma.project.deleteMany({
    where: { id: { in: [pm1TestProject.id, pm2TestProject.id] } },
  });

  console.log("All Role-Based Dashboard Metrics, Resource Authorization & Query Filter tests PASSED successfully.");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
