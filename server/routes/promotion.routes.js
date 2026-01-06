import express from "express";
import {
  createPromotion,
  deletePromotion,
  evaluatePromotionHandler,
  getPromotionById,
  listPromotions,
  updatePromotion,
} from "../controllers/promotion.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("promotions"));

router
  .route("/")
  .post(
    requirePermission({ module: "promotions", action: "create" }),
    createPromotion
  )
  .get(
    requirePermission({ module: "promotions", action: "read" }),
    listPromotions
  );

router
  .route("/:id")
  .get(
    requirePermission({ module: "promotions", action: "read" }),
    getPromotionById
  )
  .put(
    requirePermission({ module: "promotions", action: "update" }),
    updatePromotion
  )
  .delete(
    requirePermission({ module: "promotions", action: "delete" }),
    deletePromotion
  );

router.post(
  "/:id/evaluate",
  requirePermission({ module: "promotions", action: "read" }),
  evaluatePromotionHandler
);

export default router;
