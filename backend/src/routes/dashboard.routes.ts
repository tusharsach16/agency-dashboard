import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { dashboardFilterQuerySchema } from "./dashboard.schema";
import { getStats, getDashboard } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", requireAuth, getStats);
router.get("/", requireAuth, validate(dashboardFilterQuerySchema), getDashboard);

export default router;
