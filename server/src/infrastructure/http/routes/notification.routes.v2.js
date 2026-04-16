import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import { NotificationController } from "../controllers/NotificationController.js";

const router = Router();
const controller = new NotificationController();

router.use(protect, businessContext);

// FASE 3 - Multi-tenant notifications
router.get("/pending", (req, res) => controller.getPending(req, res));
router.get("/history", (req, res) => controller.getHistory(req, res));
router.post(
  "/send",
  requirePermission({ module: "config", action: "create" }),
  (req, res) => controller.send(req, res),
);
router.put("/:id/viewed", (req, res) => controller.markAsViewed(req, res));
router.put("/viewed-all", (req, res) => controller.markAllAsViewed(req, res));

// Legacy aliases (compatibilidad temporal)
router.get("/", (req, res) => controller.getAll(req, res));
router.post(
  "/",
  requirePermission({ module: "config", action: "create" }),
  (req, res) => controller.create(req, res),
);
router.put("/:id/read", (req, res) => controller.markAsRead(req, res));
router.put("/read-all", (req, res) => controller.markAllAsRead(req, res));

export default router;
