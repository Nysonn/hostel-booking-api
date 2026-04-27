import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createPaymentSchema } from "./payment.schema";
import * as controller from "./payment.controller";

const router = Router();

router.use(requireAuth, requireRole("student"), requireNotSuspended);

router.post(
  "/:bookingId/payments",
  validate(createPaymentSchema),
  controller.createPayment
);

router.get("/:bookingId/payments", controller.getPayments);

export default router;
