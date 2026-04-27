import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createBookingSchema } from "./booking.schema";
import * as controller from "./booking.controller";

const router = Router();

// All booking routes: requireAuth + requireRole('student') + requireNotSuspended
router.use(requireAuth, requireRole("student"), requireNotSuspended);

router.post("/", validate(createBookingSchema), controller.createBooking);
router.post("/:bookingId/terminate", controller.terminateBooking);
router.get("/", controller.getBookings);
router.get("/:bookingId", controller.getBooking);

export default router;
