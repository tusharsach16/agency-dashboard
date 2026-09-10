import { Role, TaskStatus, TaskPriority, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { assertProjectAccess } from "../utils/authorization";
import { DashboardStats, DashboardFilterParams, StatusCounts, PriorityCounts } from "../types/dashboard";

export async function getDashboardStats(user: { sub: string; role: Role }): Promise<DashboardStats> {
  const taskWhere: Prisma.TaskWhereInput = {};
  const projectWhere: Prisma.ProjectWhereInput = {};

  if (user.role === Role.PM) {
    taskWhere.project = { managerId: user.sub };
    projectWhere.managerId = user.sub;
  } else if (user.role === Role.DEVELOPER) {
    taskWhere.assignedToId = user.sub;
    projectWhere.tasks = { some: { assignedToId: user.sub } };
  }

  const [totalProjects, totalTasks, overdueTasks, statusGroups, priorityGroups] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.task.count({ where: taskWhere }),
    prisma.task.count({
      where: {
        ...taskWhere,
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: taskWhere,
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["priority"],
      where: taskWhere,
      _count: { _all: true },
    }),
  ]);

  const statusBreakdown: StatusCounts = {
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
  };

  statusGroups.forEach((g) => {
    if (g.status in statusBreakdown) {
      statusBreakdown[g.status] = g._count._all;
    }
  });

  const priorityBreakdown: PriorityCounts = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  priorityGroups.forEach((g) => {
    if (g.priority in priorityBreakdown) {
      priorityBreakdown[g.priority] = g._count._all;
    }
  });

  return {
    totalProjects,
    totalTasks,
    overdueTasks,
    statusBreakdown,
    priorityBreakdown,
  };
}

export async function getFilteredDashboardData(
  user: { sub: string; role: Role },
  filters: DashboardFilterParams
) {
  const taskWhere: Prisma.TaskWhereInput = {};
  const projectWhere: Prisma.ProjectWhereInput = {};

  if (user.role === Role.ADMIN) {
    if (filters.projectId) {
      const project = await prisma.project.findUnique({ where: { id: filters.projectId } });
      if (!project) throw ApiError.notFound("Project not found");
      taskWhere.projectId = filters.projectId;
    }
    if (filters.assignedToId) {
      taskWhere.assignedToId = filters.assignedToId;
    }
  } else if (user.role === Role.PM) {
    projectWhere.managerId = user.sub;
    if (filters.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: filters.projectId },
        include: { tasks: { select: { assignedToId: true } } },
      });
      if (!project) throw ApiError.notFound("Project not found");
      assertProjectAccess(user, project);
      taskWhere.projectId = filters.projectId;
    } else {
      taskWhere.project = { managerId: user.sub };
    }
    if (filters.assignedToId) {
      taskWhere.assignedToId = filters.assignedToId;
    }
  } else if (user.role === Role.DEVELOPER) {
    if (filters.assignedToId && filters.assignedToId !== user.sub) {
      throw ApiError.forbidden("Developers can only access their own assigned tasks");
    }
    taskWhere.assignedToId = user.sub;
    projectWhere.tasks = { some: { assignedToId: user.sub } };

    if (filters.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: filters.projectId },
        include: { tasks: { select: { assignedToId: true } } },
      });
      if (!project) throw ApiError.notFound("Project not found");
      assertProjectAccess(user, project);
      taskWhere.projectId = filters.projectId;
    }
  }

  if (filters.status) {
    taskWhere.status = filters.status;
  }
  if (filters.priority) {
    taskWhere.priority = filters.priority;
  }

  const [stats, tasks, projects] = await Promise.all([
    getDashboardStats(user),
    prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    prisma.project.findMany({
      where: projectWhere,
      include: {
        client: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { stats, tasks, projects };
}
