import { Router } from "express";
import { Role } from "@prisma/client";
import {
  listUsers,
  listDevelopers,
  getUser,
  createUser,
  updateUserRole,
} from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserRoleSchema,
} from "./user.schema";

const router = Router();

router.use(requireAuth);

router.get("/developers", requireRole(Role.ADMIN, Role.PM), listDevelopers);

router.get("/", requireRole(Role.ADMIN, Role.PM), validate(listUsersSchema), (req, res, next) => {
  if (req.user?.role === Role.PM) {
    req.query.role = Role.DEVELOPER;
  }
  listUsers(req, res, next);
});

router.use(requireRole(Role.ADMIN));

router.get("/:id", validate(getUserSchema), getUser);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRole);

export default router;
