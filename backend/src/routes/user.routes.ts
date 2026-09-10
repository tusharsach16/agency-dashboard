import { Router } from "express";
import { Role } from "@prisma/client";
import { listUsers, getUser, createUser, updateUserRole } from "../controllers/user.controller";
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
router.use(requireRole(Role.ADMIN));

router.get("/", validate(listUsersSchema), listUsers);
router.get("/:id", validate(getUserSchema), getUser);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id/role", validate(updateUserRoleSchema), updateUserRole);

export default router;
