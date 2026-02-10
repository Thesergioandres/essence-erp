import { Router } from "express";
import { DistributorController } from "../controllers/DistributorController.js";

const router = Router();
const controller = new DistributorController();

// Public distributor catalog (no auth)
router.get("/:id/catalog", (req, res) => controller.getPublicCatalog(req, res));

export default router;
