import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { assertProjectAccess } from "../utils/authorization";

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
      include: { client: true, tasks: true },
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
      return next(ApiError.badRequest("Invalid clientId"));
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        managerId: user.sub,
      },
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
}
