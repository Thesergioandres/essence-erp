import express from "express";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
} from "../controllers/branch.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, admin);

router.post("/", createBranch);
router.get("/", listBranches);
router.patch("/:id", updateBranch);
router.delete("/:id", deleteBranch);

export default router;
