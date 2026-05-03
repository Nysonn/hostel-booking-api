import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createUniversitySchema } from "./admin.schema";
import * as controller from "./admin.controller";

const router = Router();

router.use(requireAuth, requireRole("admin"), requireNotSuspended);

router.get("/me", controller.getMe);
router.get("/users", controller.getAllUsers);
router.get("/universities", controller.getUniversities);
router.get("/landlords", controller.getLandlords);
router.get("/students", controller.getStudents);

router.patch("/users/:userId/suspend", controller.suspendUser);
router.patch("/users/:userId/unsuspend", controller.unsuspendUser);
router.delete("/users/:userId", controller.deleteUser);

router.post(
  "/universities",
  validate(createUniversitySchema),
  controller.createUniversity
);

export default router;
