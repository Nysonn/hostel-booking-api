import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createLandlordSchema, resetPasswordSchema } from "./university.schema";
import * as controller from "./university.controller";

const router = Router();

// ── Auth (no suspension check on password reset / logout) ──────────────────
router.post(
  "/auth/reset-password",
  requireAuth,
  requireRole("university"),
  validate(resetPasswordSchema),
  controller.resetPassword
);

router.post("/auth/logout", requireAuth, controller.logout);

// ── Protected university routes ────────────────────────────────────────────
const protected_ = Router();
protected_.use(requireAuth, requireRole("university"), requireNotSuspended);

protected_.get("/me", controller.getMe);

protected_.post(
  "/landlords",
  validate(createLandlordSchema),
  controller.createLandlord
);

protected_.get("/landlords", controller.getLandlords);
protected_.patch("/landlords/:userId/suspend", controller.suspendLandlord);
protected_.patch("/landlords/:userId/unsuspend", controller.unsuspendLandlord);
protected_.get("/students", controller.getStudents);
protected_.get("/hostels", controller.getHostels);

router.use(protected_);

export default router;
