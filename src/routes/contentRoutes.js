import { Router } from "express";
import { getAllContents, getContentById, createContent, updateContent, addChecklistItem, deleteContent, snapshotMetrics } from "../controllers/contentController.js";
import { requireRole } from "../middlewares/middleware.js";

const router = Router();
// Hak akses per konten (status yang boleh dilihat, siapa pemiliknya) dicek di controller.
router.get("/", getAllContents);
router.get("/:id", getContentById);
<<<<<<< HEAD
router.post("/", requireRole("admin", "creator"), createContent);
router.put("/:id", updateContent);
router.patch("/:id", updateContent);
router.delete("/:id", requireRole("admin", "creator"), deleteContent);
=======
router.post("/", createContent);
router.patch("/:id", updateContentStatus);
router.delete("/:id", deleteContent);
>>>>>>> 6a66ee81024269227810225b8fa1a3209dac728f
router.post("/:id/checklists", addChecklistItem);
router.post("/:id/metrics", requireRole("admin"), snapshotMetrics);

export default router;
