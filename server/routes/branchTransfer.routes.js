import express from "express";
import {
  createBranchTransfer,
  listBranchTransfers,
} from "../controllers/branchTransfer.controller.js";
import { admin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect, admin);

router.post("/", createBranchTransfer);
router.get("/", listBranchTransfers);

export default router;
