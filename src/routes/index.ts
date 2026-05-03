import { Router } from "express";
import adminRouter from "../modules/admin/admin.routes";
import analyticsRouter from "../modules/admin/analytics.routes";
import universityRouter from "../modules/university/university.routes";
import landlordRouter from "../modules/landlord/landlord.routes";
import studentRouter from "../modules/student/student.routes";
import bookingRouter from "../modules/booking/booking.routes";
import paymentRouter from "../modules/payment/payment.routes";

const router = Router();

// ── Health ─────────────────────────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// ── Module routers ─────────────────────────────────────────────────────────
router.use("/admin", adminRouter);
router.use("/admin/analytics", analyticsRouter);
router.use("/university", universityRouter);
router.use("/landlord", landlordRouter);
router.use("/student", studentRouter);

// Booking and payment are both nested under /student/bookings.
// Express evaluates them in order; unmatched requests fall through to the next.
router.use("/student/bookings", bookingRouter);
router.use("/student/bookings", paymentRouter);

export default router;
