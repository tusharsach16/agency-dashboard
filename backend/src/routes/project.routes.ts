import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { listProjects, getProject, createProject } from "../controllers/project.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listProjects);
router.get("/:id", getProject);
router.post("/", requireRole(Role.ADMIN, Role.PM), createProject);

export default router;
