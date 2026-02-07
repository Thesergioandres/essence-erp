import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import { businessContext } from "../../../../middleware/business.middleware.js";
import { requireFeature } from "../../../../middleware/business.middleware.js";
import { requirePermission } from "../../../../middleware/business.middleware.js";
import { PromotionController } from "../controllers/PromotionController.js";

const router = Router();
const controller = new PromotionController();

router.use(protect, businessContext, requireFeature("promotions"));

router.post(
  "/",
  requirePermission({ module: "promotions", action: "create" }),
  (req, res) => controller.create(req, res),
);
router.get(
  "/",
  requirePermission({ module: "promotions", action: "read" }),
  (req, res) => controller.getAll(req, res),
);
router.get(
  "/active",
  requirePermission({ module: "promotions", action: "read" }),
  (req, res) => controller.getActive(req, res),
);
router.get(
  "/:id",
  requirePermission({ module: "promotions", action: "read" }),
  (req, res) => controller.getById(req, res),
);
router.put(
  "/:id",
  requirePermission({ module: "promotions", action: "update" }),
  (req, res) => controller.update(req, res),
);
router.delete(
  "/:id",
  requirePermission({ module: "promotions", action: "delete" }),
  (req, res) => controller.delete(req, res),
);
router.post(
  "/:id/evaluate",
  requirePermission({ module: "promotions", action: "read" }),
  (req, res) => controller.evaluate(req, res),
);

export default router;
