import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { upload } from "../../config/multer";
import {
  createHostelSchema,
  createRoomSchema,
  resetPasswordSchema,
  updateRoomSchema,
} from "./landlord.schema";
import * as controller from "./landlord.controller";

const router = Router();

// ── Auth (no suspension check) ─────────────────────────────────────────────
router.post(
  "/auth/reset-password",
  requireAuth,
  requireRole("landlord"),
  validate(resetPasswordSchema),
  controller.resetPassword
);

router.post("/auth/logout", requireAuth, controller.logout);

// ── Protected landlord routes ──────────────────────────────────────────────
const protected_ = Router();
protected_.use(requireAuth, requireRole("landlord"), requireNotSuspended);

protected_.post(
  "/hostels",
  upload.array("images", 10),
  validate(createHostelSchema),
  controller.createHostel
);

protected_.get("/hostels", controller.getHostels);
protected_.get("/hostels/:hostelId", controller.getHostel);
protected_.get("/hostels/:hostelId/bookings", controller.getHostelBookings);

protected_.post(
  "/hostels/:hostelId/rooms",
  validate(createRoomSchema),
  controller.createRoom
);

protected_.patch(
  "/hostels/:hostelId/rooms/:roomId",
  validate(updateRoomSchema),
  controller.updateRoom
);

protected_.get("/notifications", controller.getNotifications);

router.use(protected_);

export default router;
