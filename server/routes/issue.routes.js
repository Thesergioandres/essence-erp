import express from "express";
import {
  createIssue,
  listIssues,
  updateIssueStatus,
} from "../controllers/issue.controller.js";
import { god, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createIssue);
router.get("/", god, listIssues);
router.patch("/:id", god, updateIssueStatus);

export default router;
