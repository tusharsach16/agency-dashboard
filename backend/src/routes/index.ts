import { Router } from "express";
import authRoutes from "./auth.routes";
import projectRoutes from "./project.routes";
import userRoutes from "./user.routes";
import clientRoutes from "./client.routes";
import taskRoutes from "./task.routes";
import activityRoutes from "./activity.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/tasks", taskRoutes);
router.use("/activity", activityRoutes);

export default router;
