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
