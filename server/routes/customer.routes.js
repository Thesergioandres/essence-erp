import express from "express";
import {
  adjustPoints,
  createCustomer,
  customerRFM,
  customerStats,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from "../controllers/customer.controller.js";
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
    createCustomer
  )
  .get(requirePermission({ module: "clients", action: "read" }), listCustomers);

router.get(
  "/stats",
  requirePermission({ module: "clients", action: "read" }),
  customerStats
);

router.get(
  "/rfm",
  requirePermission({ module: "clients", action: "read" }),
  customerRFM
);

router
  .route("/:id")
  .get(
    requirePermission({ module: "clients", action: "read" }),
    getCustomerById
  )
  .put(
    requirePermission({ module: "clients", action: "update" }),
    updateCustomer
  )
  .delete(
    requirePermission({ module: "clients", action: "delete" }),
    deleteCustomer
  );

router.post(
  "/:id/points",
  requirePermission({ module: "clients", action: "update" }),
  adjustPoints
);

export default router;
