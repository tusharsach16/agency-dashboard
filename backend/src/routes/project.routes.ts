import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
  deleteProjectSchema,
} from "./project.schema";

const router = Router();

router.use(requireAuth);

router.get("/", listProjects);
router.get("/:id", validate(getProjectSchema), getProject);
router.post(
  "/",
  requireRole(Role.ADMIN, Role.PM),
  validate(createProjectSchema),
  createProject
);
router.patch(
  "/:id",
  requireRole(Role.ADMIN, Role.PM),
  validate(updateProjectSchema),
  updateProject
);
router.delete(
  "/:id",
  requireRole(Role.ADMIN, Role.PM),
  validate(deleteProjectSchema),
  deleteProject
);

export default router;
