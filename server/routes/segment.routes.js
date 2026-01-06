import express from "express";
import {
  createSegment,
  deleteSegment,
  getSegmentById,
  listSegments,
  updateSegment,
} from "../controllers/segment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, requireFeature("clients"));

router
  .route("/")
  .post(
    requirePermission({ module: "clients", action: "create" }),
    createSegment
  )
  .get(requirePermission({ module: "clients", action: "read" }), listSegments);

router
  .route("/:id")
  .get(requirePermission({ module: "clients", action: "read" }), getSegmentById)
  .put(
    requirePermission({ module: "clients", action: "update" }),
    updateSegment
  )
  .delete(
    requirePermission({ module: "clients", action: "delete" }),
    deleteSegment
  );

export default router;
