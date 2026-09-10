import { Role } from "@prisma/client";
import { AccessTokenPayload } from "../types/auth";
import { ApiError } from "./ApiError";

export function assertProjectAccess(
  user: AccessTokenPayload,
  project: { managerId: string; tasks?: Array<{ assignedToId: string | null }> }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.PM) {
    if (project.managerId !== user.sub) {
      throw ApiError.forbidden("You do not have access to this project");
    }
    return;
  }

  if (user.role === Role.DEVELOPER) {
    const isAssigned = project.tasks?.some((t) => t.assignedToId === user.sub);
    if (!isAssigned) {
      throw ApiError.forbidden("You do not have access to this project");
    }
    return;
  }

  throw ApiError.forbidden("Access denied");
}

export function assertProjectManageAccess(
  user: AccessTokenPayload,
  project: { managerId: string }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.PM) {
    if (project.managerId !== user.sub) {
      throw ApiError.forbidden("You do not have permission to manage this project");
    }
    return;
  }

  throw ApiError.forbidden("Developers cannot manage projects");
}

export function assertTaskAccess(
  user: AccessTokenPayload,
  task: { assignedToId: string | null; project?: { managerId: string } }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.PM) {
    if (task.project && task.project.managerId !== user.sub) {
      throw ApiError.forbidden("You do not have access to tasks in this project");
    }
    return;
  }

  if (user.role === Role.DEVELOPER) {
    if (task.assignedToId !== user.sub) {
      throw ApiError.forbidden("You do not have access to this task");
    }
    return;
  }

  throw ApiError.forbidden("Access denied");
}

export function assertTaskManageAccess(
  user: AccessTokenPayload,
  task: { project?: { managerId: string } }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.PM) {
    if (task.project && task.project.managerId !== user.sub) {
      throw ApiError.forbidden("You do not have permission to manage tasks in this project");
    }
    return;
  }

  throw ApiError.forbidden("Developers cannot manage task metadata or assignments");
}

export function assertTaskStatusUpdateAccess(
  user: AccessTokenPayload,
  task: { assignedToId: string | null; project?: { managerId: string } }
) {
  if (user.role === Role.ADMIN) {
    return;
  }

  if (user.role === Role.PM) {
    if (task.project && task.project.managerId !== user.sub) {
      throw ApiError.forbidden("You do not have permission to update tasks in this project");
    }
    return;
  }

  if (user.role === Role.DEVELOPER) {
    if (task.assignedToId !== user.sub) {
      throw ApiError.forbidden("You can only update status for tasks assigned to you");
    }
    return;
  }

  throw ApiError.forbidden("Access denied");
}
