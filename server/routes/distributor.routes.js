import express from "express";
import {
  createDistributor,
  deleteDistributor,
  getDistributorById,
  getDistributors,
  toggleDistributorActive,
  updateDistributor,
} from "../controllers/distributor.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Rutas que distribuidores también pueden usar
router.get(
  "/",
  protect,
  businessContext,
  cacheMiddleware(60, "distributors"),
  getDistributors
); // Distribuidores pueden ver la lista (para transferencias)

// Rutas solo para admin
router.post("/", protect, businessContext, admin, createDistributor);
router.get("/:id", protect, businessContext, admin, getDistributorById);
router.put("/:id", protect, businessContext, admin, updateDistributor);
router.delete("/:id", protect, businessContext, admin, deleteDistributor);
router.patch(
  "/:id/toggle-active",
  protect,
  businessContext,
  admin,
  toggleDistributorActive
);

export default router;
