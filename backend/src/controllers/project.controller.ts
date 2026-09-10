import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { assertProjectAccess, assertProjectManageAccess } from "../utils/authorization";

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;

    const where =
      user.role === Role.ADMIN
        ? {}
        : user.role === Role.PM
        ? { managerId: user.sub }
        : { tasks: { some: { assignedToId: user.sub } } };

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return next(ApiError.notFound("Project not found"));
    }

    assertProjectAccess(user, project);

    res.json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { name, description, clientId } = req.body;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return next(ApiError.badRequest("Referenced client does not exist"));
    }

    let managerId = user.sub;

    if (user.role === Role.ADMIN) {
      if (req.body.managerId) {
        const assignedManager = await prisma.user.findUnique({
          where: { id: req.body.managerId },
        });

        if (!assignedManager) {
          return next(ApiError.badRequest("Referenced manager does not exist"));
        }

        if (assignedManager.role !== Role.PM) {
          return next(ApiError.badRequest("Assigned manager must have PM role"));
        }

        managerId = assignedManager.id;
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        clientId,
        managerId,
      },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { name, description, clientId, managerId } = req.body;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return next(ApiError.notFound("Project not found"));
    }

    assertProjectManageAccess(user, existingProject);

    const data: {
      name?: string;
      description?: string | null;
      clientId?: string;
      managerId?: string;
    } = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (clientId !== undefined) {
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      if (!client) {
        return next(ApiError.badRequest("Referenced client does not exist"));
      }
      data.clientId = clientId;
    }

    if (managerId !== undefined) {
      if (user.role !== Role.ADMIN) {
        return next(ApiError.forbidden("Only admins can reassign project managers"));
      }

      const assignedManager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!assignedManager) {
        return next(ApiError.badRequest("Referenced manager does not exist"));
      }

      if (assignedManager.role !== Role.PM) {
        return next(ApiError.badRequest("Assigned manager must have PM role"));
      }

      data.managerId = managerId;
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ success: true, project: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({ where: { id } });
    if (!existingProject) {
      return next(ApiError.notFound("Project not found"));
    }

    assertProjectManageAccess(user, existingProject);

    await prisma.project.delete({ where: { id } });

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    next(err);
  }
}
