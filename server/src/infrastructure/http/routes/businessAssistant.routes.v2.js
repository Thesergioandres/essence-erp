import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import { BusinessAssistantController } from "../controllers/BusinessAssistantController.js";

const router = Router();
const controller = new BusinessAssistantController();

router.use(protect, businessContext, requireFeature("businessAssistant"));

// Analysis routes - MUST be before any parameterized routes
router.get("/analysis/latest", (req, res) =>
  controller.getLatestAnalysis(req, res),
);

router.get("/strategic-analysis", (req, res) =>
  controller.getStrategicAnalysis(req, res),
);

router.get(
  "/config",
  requirePermission("manageBusinessAssistant"),
  (req, res) => controller.getConfig(req, res),
);
router.put(
  "/config",
  requirePermission("manageBusinessAssistant"),
  (req, res) => controller.updateConfig(req, res),
);
router.get("/recommendations", (req, res) =>
  controller.generateRecommendations(req, res),
);
router.post("/ask", (req, res) => controller.askAssistant(req, res));

export default router;
