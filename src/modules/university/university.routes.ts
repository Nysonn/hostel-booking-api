import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { upload } from "../../config/multer";
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

protected_.post(
  "/landlords",
  upload.array("ownership_documents", 10),
  validate(createLandlordSchema),
  controller.createLandlord
);

protected_.get("/landlords", controller.getLandlords);
protected_.get("/students", controller.getStudents);
protected_.get("/hostels", controller.getHostels);

router.use(protected_);

export default router;
