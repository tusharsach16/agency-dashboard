import { Request, Response, NextFunction } from "express";
import { Role, TaskPriority, TaskStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  assertTaskAccess,
  assertTaskManageAccess,
  assertTaskStatusUpdateAccess,
} from "../utils/authorization";
import { createStatusActivityLog } from "../services/activity.service";
import {
  formatActivityEvent,
  broadcastActivityEvent,
} from "../services/activity-broadcast.service";
import {
  createAssignmentNotification,
  createStatusChangeNotification,
  broadcastTaskNotifications,
} from "../services/task-notification.service";
import { NotificationPayload } from "../types/notification";

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { projectId, status, priority, assignedToId } = req.query as {
      projectId?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedToId?: string;
    };

    const where: Prisma.TaskWhereInput = {};

    if (user.role === Role.ADMIN) {
      if (projectId) where.projectId = projectId;
      if (assignedToId) where.assignedToId = assignedToId;
    } else if (user.role === Role.PM) {
      if (projectId) {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project || project.managerId !== user.sub) {
          return next(ApiError.forbidden("You do not have access to tasks in this project"));
        }
        where.projectId = projectId;
      } else {
        where.project = { managerId: user.sub };
      }
      if (assignedToId) where.assignedToId = assignedToId;
    } else if (user.role === Role.DEVELOPER) {
      where.assignedToId = user.sub;
      if (projectId) where.projectId = projectId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, managerId: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, managerId: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return next(ApiError.notFound("Task not found"));
    }

    assertTaskAccess(user, task);

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { title, description, projectId, assignedToId, status, priority, dueDate } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(ApiError.notFound("Referenced project not found"));
    }

    if (user.role === Role.PM && project.managerId !== user.sub) {
      return next(ApiError.forbidden("You can only create tasks in your own projects"));
    }

    let parsedDueDate: Date | null = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return next(ApiError.badRequest("Invalid dueDate format"));
      }
      parsedDueDate = d;
    }

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee) {
        return next(ApiError.badRequest("Assigned user does not exist"));
      }
      if (assignee.role !== Role.DEVELOPER) {
        return next(ApiError.badRequest("Tasks can only be assigned to users with DEVELOPER role"));
      }
    }

    const { task, notification } = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          title,
          description: description ?? null,
          projectId,
          assignedToId: assignedToId ?? null,
          status: status ?? TaskStatus.TODO,
          priority: priority ?? TaskPriority.MEDIUM,
          dueDate: parsedDueDate,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      const notif = await createAssignmentNotification(tx, {
        assigneeId: assignedToId,
        taskId: created.id,
        taskTitle: created.title,
        actorId: user.sub,
      });

      return { task: created, notification: notif };
    });

    if (notification) {
      await broadcastTaskNotifications([notification]);
    }

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { managerId: true } },
      },
    });

    if (!existingTask) {
      return next(ApiError.notFound("Task not found"));
    }

    if (user.role === Role.DEVELOPER) {
      if (
        title !== undefined ||
        description !== undefined ||
        priority !== undefined ||
        dueDate !== undefined ||
        assignedToId !== undefined
      ) {
        return next(ApiError.forbidden("Developers can only update task status"));
      }

      assertTaskStatusUpdateAccess(user, existingTask);

      if (status !== undefined && status !== existingTask.status) {
        const { updatedTask, log, notification } = await prisma.$transaction(async (tx) => {
          const t = await tx.task.update({
            where: { id },
            data: { status },
            include: {
              project: { select: { id: true, name: true } },
              assignedTo: { select: { id: true, name: true, email: true } },
            },
          });

          const createdLog = await createStatusActivityLog(tx, {
            taskId: id,
            projectId: existingTask.projectId,
            userId: user.sub,
            fromValue: existingTask.status,
            toValue: status,
          });

          const notif = await createStatusChangeNotification(tx, {
            recipientId: existingTask.project.managerId,
            taskId: id,
            taskTitle: t.title,
            status,
            actorId: user.sub,
          });

          return { updatedTask: t, log: createdLog, notification: notif };
        });

        const event = formatActivityEvent(log);
        broadcastActivityEvent(existingTask.projectId, event);

        if (notification) {
          await broadcastTaskNotifications([notification]);
        }

        return res.json({ success: true, task: updatedTask });
      }

      return res.json({ success: true, task: existingTask });
    }

    assertTaskManageAccess(user, existingTask);

    const data: Prisma.TaskUpdateInput = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;

    if (dueDate !== undefined) {
      if (dueDate === null) {
        data.dueDate = null;
      } else {
        const d = new Date(dueDate);
        if (isNaN(d.getTime())) {
          return next(ApiError.badRequest("Invalid dueDate format"));
        }
        data.dueDate = d;
      }
    }

    if (assignedToId !== undefined) {
      if (assignedToId === null) {
        data.assignedTo = { disconnect: true };
      } else {
        const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (!assignee) {
          return next(ApiError.badRequest("Assigned user does not exist"));
        }
        if (assignee.role !== Role.DEVELOPER) {
          return next(ApiError.badRequest("Tasks can only be assigned to users with DEVELOPER role"));
        }
        data.assignedTo = { connect: { id: assignedToId } };
      }
    }

    if (status !== undefined) {
      data.status = status;
    }

    const isStatusChanged = status !== undefined && status !== existingTask.status;
    const isAssigneeChanged =
      assignedToId !== undefined &&
      assignedToId !== existingTask.assignedToId &&
      assignedToId !== null &&
      assignedToId !== user.sub;

    const { updatedTask, log, notifications } = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id },
        data,
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      let createdLog = null;
      if (isStatusChanged) {
        createdLog = await createStatusActivityLog(tx, {
          taskId: id,
          projectId: existingTask.projectId,
          userId: user.sub,
          fromValue: existingTask.status,
          toValue: status,
        });
      }

      const generatedNotifs: (NotificationPayload | null)[] = [];

      if (isAssigneeChanged && assignedToId) {
        const assignNotif = await createAssignmentNotification(tx, {
          assigneeId: assignedToId,
          taskId: id,
          taskTitle: t.title,
          actorId: user.sub,
        });
        if (assignNotif) generatedNotifs.push(assignNotif);
      }

      if (isStatusChanged) {
        const targetAssigneeId = assignedToId !== undefined ? assignedToId : existingTask.assignedToId;
        if (targetAssigneeId && targetAssigneeId !== user.sub && targetAssigneeId !== assignedToId) {
          const statusNotif = await createStatusChangeNotification(tx, {
            recipientId: targetAssigneeId,
            taskId: id,
            taskTitle: t.title,
            status,
            actorId: user.sub,
          });
          if (statusNotif) generatedNotifs.push(statusNotif);
        }
      }

      return { updatedTask: t, log: createdLog, notifications: generatedNotifs };
    });

    if (log) {
      const event = formatActivityEvent(log);
      broadcastActivityEvent(existingTask.projectId, event);
    }

    if (notifications.length > 0) {
      await broadcastTaskNotifications(notifications);
    }

    res.json({ success: true, task: updatedTask });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { managerId: true } },
      },
    });

    if (!existingTask) {
      return next(ApiError.notFound("Task not found"));
    }

    assertTaskStatusUpdateAccess(user, existingTask);

    if (existingTask.status === status) {
      return res.json({ success: true, task: existingTask });
    }

    const { updatedTask, log, notification } = await prisma.$transaction(async (tx) => {
      const t = await tx.task.update({
        where: { id },
        data: { status },
        include: {
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      const createdLog = await createStatusActivityLog(tx, {
        taskId: id,
        projectId: existingTask.projectId,
        userId: user.sub,
        fromValue: existingTask.status,
        toValue: status,
      });

      let notif: NotificationPayload | null = null;
      if (user.role === Role.DEVELOPER) {
        notif = await createStatusChangeNotification(tx, {
          recipientId: existingTask.project.managerId,
          taskId: id,
          taskTitle: t.title,
          status,
          actorId: user.sub,
        });
      } else {
        if (existingTask.assignedToId) {
          notif = await createStatusChangeNotification(tx, {
            recipientId: existingTask.assignedToId,
            taskId: id,
            taskTitle: t.title,
            status,
            actorId: user.sub,
          });
        }
      }

      return { updatedTask: t, log: createdLog, notification: notif };
    });

    const event = formatActivityEvent(log);
    broadcastActivityEvent(existingTask.projectId, event);

    if (notification) {
      await broadcastTaskNotifications([notification]);
    }

    res.json({ success: true, task: updatedTask });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { managerId: true } },
      },
    });

    if (!existingTask) {
      return next(ApiError.notFound("Task not found"));
    }

    assertTaskManageAccess(user, existingTask);

    await prisma.task.delete({ where: { id } });

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    next(err);
  }
}
