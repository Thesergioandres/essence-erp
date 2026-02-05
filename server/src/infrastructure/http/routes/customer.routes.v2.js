import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware.js";
import {
  businessContext,
  requireFeature,
  requirePermission,
} from "../../../../middleware/business.middleware.js";
import { CustomerController } from "../controllers/CustomerController.js";

const router = Router();
const controller = new CustomerController();

router.use(protect, businessContext, requireFeature("crm"));

const allowDistributor = (permission) => (req, res, next) => {
  if (req.user?.role === "distribuidor") return next();
  return requirePermission(permission)(req, res, next);
};

router.post("/", allowDistributor("createCustomer"), (req, res) =>
  controller.create(req, res),
);
router.get("/", allowDistributor("readCustomer"), (req, res) =>
  controller.getAll(req, res),
);
router.get("/:id", allowDistributor("readCustomer"), (req, res) =>
  controller.getById(req, res),
);
router.put("/:id", requirePermission("updateCustomer"), (req, res) =>
  controller.update(req, res),
);
router.delete("/:id", requirePermission("deleteCustomer"), (req, res) =>
  controller.delete(req, res),
);

export default router;
