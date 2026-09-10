import { Router } from "express";
import { listActivity } from "../controllers/activity.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listActivitySchema } from "./activity.schema";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listActivitySchema), listActivity);

export default router;
