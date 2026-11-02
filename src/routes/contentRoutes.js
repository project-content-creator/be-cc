import { Router } from "express";
import { 
    getAllContents, 
    getContentById, 
    createContent, 
    updateContentStatus, 
    addChecklistItem, 
    deleteContent, 
    snapshotMetrics } 
    from "../controllers/contentController.js";
import { requireRole } from "../middlewares/middleware.js";

const router = Router();
router.get("/", getAllContents);
router.get("/:id", getContentById);
router.post("/", requireRole("admin", "creator"), createContent);
router.put("/:id", updateContentStatus);
router.patch("/:id", updateContentStatus);
router.delete("/:id", requireRole("admin", "creator"), deleteContent);
router.post("/:id/checklists", addChecklistItem);
router.post("/:id/metrics", requireRole("admin"), snapshotMetrics);

export default router;
