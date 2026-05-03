import { Router } from "express";
import { requireAuth, requireNotSuspended, requireRole } from "../../middlewares/auth";
import * as controller from "./analytics.controller";

const router = Router();

router.use(requireAuth, requireRole("admin"), requireNotSuspended);

// Full dashboard (all sections in one request)
router.get("/dashboard", controller.getDashboard);

// Individual sections
router.get("/overview", controller.getOverview);
router.get("/revenue", controller.getRevenue);
router.get("/universities", controller.getUniversityBreakdown);
router.get("/registrations", controller.getRecentRegistrations);

export default router;
