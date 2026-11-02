import { Router } from "express";
import { getAllContents, getContentById, createContent, updateContent, addChecklistItem, deleteContent, snapshotMetrics } from "../controllers/contentController.js";
import { requireRole } from "../middlewares/middleware.js";

const router = Router();
// Hak akses per konten (status yang boleh dilihat, siapa pemiliknya) dicek di controller.
router.get("/", getAllContents);
router.get("/:id", getContentById);
router.post("/", requireRole("admin", "creator"), createContent);
router.put("/:id", updateContent);
router.patch("/:id", updateContent);
router.delete("/:id", requireRole("admin", "creator"), deleteContent);
router.post("/:id/checklists", addChecklistItem);
router.post("/:id/metrics", requireRole("admin"), snapshotMetrics);

export default router;
