import express from "express";
import {
  createBusinessAssistantRecommendationsJob,
  getBusinessAssistantConfig,
  getBusinessAssistantRecommendations,
  getBusinessAssistantRecommendationsJob,
  updateBusinessAssistantConfig,
} from "../controllers/businessAssistant.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";
import { businessContext } from "../middleware/business.middleware.js";

const router = express.Router();

router.use(protect, businessContext, admin);

router.get("/recommendations", getBusinessAssistantRecommendations);

router.get("/config", getBusinessAssistantConfig);
router.put("/config", updateBusinessAssistantConfig);

router.post("/recommendations/jobs", createBusinessAssistantRecommendationsJob);
router.get("/recommendations/jobs/:id", getBusinessAssistantRecommendationsJob);

export default router;
