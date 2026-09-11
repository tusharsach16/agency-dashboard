import { PrismaClient, Role, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "node:process";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Aditi Sharma", email: "admin@agency.dev", role: Role.ADMIN, passwordHash: password },
  });

  const pms = await Promise.all(
    ["Karan Mehta", "Priya Nair"].map((name, i) =>
      prisma.user.create({
        data: { name, email: `pm${i + 1}@agency.dev`, role: Role.PM, passwordHash: password },
      })
    )
  );

  const developers = await Promise.all(
    ["Ravi Kumar", "Sneha Iyer", "Arjun Das", "Meera Pillai"].map((name, i) =>
      prisma.user.create({
        data: { name, email: `dev${i + 1}@agency.dev`, role: Role.DEVELOPER, passwordHash: password },
      })
    )
  );

  const clients = await Promise.all(
    ["Northwind Retail", "Blue Harbor Logistics", "Solstice Media"].map((name) =>
      prisma.client.create({ data: { name, contact: `${name.split(" ")[0].toLowerCase()}@client.com` } })
    )
  );

  const statuses: TaskStatus[] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.DONE];
  const priorities: TaskPriority[] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL];

  const projectNames = ["Website Revamp", "Inventory App", "Marketing Portal"];

  for (let p = 0; p < projectNames.length; p++) {
    const project = await prisma.project.create({
      data: {
        name: projectNames[p],
        description: `${projectNames[p]} for ${clients[p].name}`,
        clientId: clients[p].id,
        managerId: pms[p % pms.length].id,
      },
    });

    for (let t = 0; t < 6; t++) {
      const isOverdueSeed = p < 2 && t === 0;
      const dueDate = isOverdueSeed
        ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + (t + 1) * 2 * 24 * 60 * 60 * 1000);

      const assignedTo = developers[(p + t) % developers.length];

      const task = await prisma.task.create({
        data: {
          title: `${projectNames[p]} - Task ${t + 1}`,
          description: "Auto-generated seed task for local development.",
          status: statuses[t % statuses.length],
          priority: priorities[t % priorities.length],
          dueDate,
          isOverdue: isOverdueSeed,
          projectId: project.id,
          assignedToId: assignedTo.id,
        },
      });

      await prisma.activityLog.create({
        data: {
          taskId: task.id,
          projectId: project.id,
          userId: assignedTo.id,
          field: "status",
          fromValue: null,
          toValue: task.status,
          createdAt: new Date(Date.now() - (t + 1) * 60 * 60 * 1000),
        },
      });

      await prisma.notification.create({
        data: {
          userId: assignedTo.id,
          taskId: task.id,
          message: `You were assigned to "${task.title}"`,
        },
      });
    }
  }

  console.log("Seed complete:", {
    admin: admin.email,
    pms: pms.map((u) => u.email),
    developers: developers.map((u) => u.email),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
