import { Router } from "express";
import { Role } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listClients, getClient, createClient } from "../controllers/client.controller";
import { createClientSchema, getClientSchema } from "./client.schema";

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.ADMIN, Role.PM));

router.get("/", listClients);
router.get("/:id", validate(getClientSchema), getClient);
router.post("/", validate(createClientSchema), createClient);

export default router;
