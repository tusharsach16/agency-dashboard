import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export async function listClients(_req: Request, res: Response, next: NextFunction) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, clients });
  } catch (err) {
    next(err);
  }
}

export async function getClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          select: { id: true, name: true },
        },
      },
    });

    if (!client) {
      return next(ApiError.notFound("Client not found"));
    }

    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, contact } = req.body;

    const client = await prisma.client.create({
      data: {
        name,
        contact: contact ?? null,
      },
    });

    res.status(201).json({ success: true, client });
  } catch (err) {
    next(err);
  }
}
