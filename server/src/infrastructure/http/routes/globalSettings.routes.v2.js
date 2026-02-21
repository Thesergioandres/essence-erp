import { Router } from "express";
import { god, protect } from "../../../../middleware/auth.middleware.js";
import { businessContext } from "../../../../middleware/business.middleware.js";
import GlobalSettingsController from "../controllers/GlobalSettingsController.js";

const router = Router();

router.get("/public", (req, res) =>
  GlobalSettingsController.getPublic(req, res),
);

router.get("/business-limits", protect, businessContext, (req, res) =>
  GlobalSettingsController.getBusinessLimits(req, res),
);

router.get("/businesses", protect, god, (req, res) =>
  GlobalSettingsController.listBusinessSubscriptions(req, res),
);

router.patch("/businesses/:businessId", protect, god, (req, res) =>
  GlobalSettingsController.updateBusinessSubscription(req, res),
);

router.put("/", protect, god, (req, res) =>
  GlobalSettingsController.updateGlobal(req, res),
);

export default router;
