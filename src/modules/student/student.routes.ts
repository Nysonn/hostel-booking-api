import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { registerStudentSchema } from "./student.schema";
import * as controller from "./student.controller";

const router = Router();

// ── Public ─────────────────────────────────────────────────────────────────
router.post(
  "/auth/register",
  validate(registerStudentSchema),
  controller.register
);

router.get("/universities", controller.getUniversities);

// ── Auth-only ──────────────────────────────────────────────────────────────
router.post("/auth/logout", requireAuth, controller.logout);

// Notifications: requireAuth + requireRole (no requireNotSuspended per spec)
router.get(
  "/notifications",
  requireAuth,
  requireRole("student"),
  controller.getNotifications
);

// ── Protected (requireAuth + requireRole + requireNotSuspended) ─────────────
const protected_ = Router();
protected_.use(requireAuth, requireRole("student"), requireNotSuspended);

protected_.get("/hostels", controller.getHostels);
protected_.get("/hostels/:hostelId", controller.getHostel);

router.use(protected_);

export default router;
