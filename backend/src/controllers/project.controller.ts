import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

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
      include: { client: true, _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ projects });
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
      include: { client: true, tasks: true },
    });

    if (!project) {
      return next(ApiError.notFound("Project not found"));
    }

    const isOwnerPM = user.role === Role.PM && project.managerId === user.sub;
    const isAssignedDeveloper =
      user.role === Role.DEVELOPER &&
      project.tasks.some((t) => t.assignedToId === user.sub);

    if (user.role !== Role.ADMIN && !isOwnerPM && !isAssignedDeveloper) {
      return next(ApiError.forbidden());
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { name, description, clientId } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        managerId: user.sub,
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}
