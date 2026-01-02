import express from "express";
import {
  checkAndEvaluatePeriod,
  evaluatePeriod,
  getAchievements,
  getAdjustedCommission,
  getConfig,
  getDistributorStats,
  getRanking,
  getWinners,
  markBonusPaid,
  updateConfig,
} from "../controllers/gamification.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
} from "../middleware/business.middleware.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Todas las rutas requieren negocio seleccionado y feature activa
router.use(protect, businessContext, requireFeature("gamification"));

// Rutas de configuración (solo admin)
router
  .route("/config")
  .get(admin, cacheMiddleware(600, "gamification"), getConfig)
  .put(admin, updateConfig);

// Rutas de ranking y ganadores con caché de 2 minutos
router.get("/ranking", cacheMiddleware(120, "gamification"), getRanking);
router.get("/winners", cacheMiddleware(300, "gamification"), getWinners);
router.get(
  "/achievements",
  cacheMiddleware(120, "gamification"),
  getAchievements
);
router.get(
  "/commission/:distributorId",
  cacheMiddleware(120, "gamification"),
  getAdjustedCommission
);

// Rutas de evaluación (solo admin)
router.post("/evaluate", admin, evaluatePeriod);
router.post("/check-period", admin, checkAndEvaluatePeriod);
router.put("/winners/:winnerId/pay", admin, markBonusPaid);

// Rutas de estadísticas de distribuidor con caché de 2 minutos
router.get(
  "/stats/:distributorId",
  cacheMiddleware(120, "gamification"),
  getDistributorStats
);

export default router;
