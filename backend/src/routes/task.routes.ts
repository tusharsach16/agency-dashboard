import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from "../controllers/task.controller";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getTaskSchema,
  deleteTaskSchema,
  listTasksSchema,
} from "./task.schema";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listTasksSchema), listTasks);
router.get("/:id", validate(getTaskSchema), getTask);
router.post(
  "/",
  requireRole(Role.ADMIN, Role.PM),
  validate(createTaskSchema),
  createTask
);
router.patch("/:id/status", validate(updateTaskStatusSchema), updateTaskStatus);
router.patch("/:id", validate(updateTaskSchema), updateTask);
router.delete(
  "/:id",
  requireRole(Role.ADMIN, Role.PM),
  validate(deleteTaskSchema),
  deleteTask
);

export default router;
