import { Role, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { assertProjectAccess } from "../utils/authorization";
import { ActivityWithRelations } from "../types/activity";

export async function getAuthorizedActivities(
  user: { sub: string; role: Role },
  projectId?: string
): Promise<ActivityWithRelations[]> {
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { select: { assignedToId: true } },
      },
    });

    if (!project) {
      return [];
    }

    assertProjectAccess(user, project);

    return prisma.activityLog.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  if (user.role === Role.ADMIN) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  if (user.role === Role.PM) {
    return prisma.activityLog.findMany({
      where: { project: { managerId: user.sub } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  return prisma.activityLog.findMany({
    where: {
      project: {
        tasks: { some: { assignedToId: user.sub } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

export async function createStatusActivityLog(
  tx: Prisma.TransactionClient,
  params: {
    taskId: string;
    projectId: string;
    userId: string;
    fromValue: string | null;
    toValue: string;
  }
): Promise<ActivityWithRelations> {
  return tx.activityLog.create({
    data: {
      taskId: params.taskId,
      projectId: params.projectId,
      userId: params.userId,
      field: "status",
      fromValue: params.fromValue,
      toValue: params.toValue,
    },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });
}
