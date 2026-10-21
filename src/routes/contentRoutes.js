import { Router } from "express";
import { getAllContents, getContentById, createContent, updateContentStatus, addChecklistItem, deleteContent, snapshotMetrics } from "../controllers/contentController.js";

const router = Router();
router.get("/", getAllContents);
router.get("/:id", getContentById);
router.post("/", createContent);
router.put("/:id", updateContentStatus);
router.delete("/:id", deleteContent);
router.post("/:id/checklists", addChecklistItem);
router.post("/:id/metrics", snapshotMetrics)

export default router;