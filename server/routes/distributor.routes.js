import express from "express";
import {
  createDistributor,
  deleteDistributor,
  getDistributorById,
  getDistributorPublicCatalog,
  getDistributors,
  toggleDistributorActive,
  updateDistributor,
} from "../controllers/distributor.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requirePermission,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Ruta pública para catálogo de distribuidor
router.get("/:id/catalog", getDistributorPublicCatalog);

// Rutas que distribuidores también pueden usar
router.get(
  "/",
  protect,
  businessContext,
  cacheMiddleware(60, "distributors"),
  getDistributors
); // Distribuidores pueden ver la lista (para transferencias)

// Rutas solo para admin
router.post(
  "/",
  protect,
  businessContext,
  requirePermission({ module: "config", action: "create" }),
  createDistributor
);
router.get(
  "/:id",
  protect,
  businessContext,
  requirePermission({ module: "config", action: "read" }),
  getDistributorById
);
router.put(
  "/:id",
  protect,
  businessContext,
  requirePermission({ module: "config", action: "update" }),
  updateDistributor
);
router.delete(
  "/:id",
  protect,
  businessContext,
  requirePermission({ module: "config", action: "delete" }),
  deleteDistributor
);
router.patch(
  "/:id/toggle-active",
  protect,
  businessContext,
  requirePermission({ module: "config", action: "update" }),
  toggleDistributorActive
);

export default router;
