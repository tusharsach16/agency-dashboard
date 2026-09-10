import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { markNotificationAsReadSchema } from "./notification.schema";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", validate(markNotificationAsReadSchema), markAsRead);

export default router;
