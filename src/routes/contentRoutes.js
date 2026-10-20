import { Router } from "express";
import { getAllContents, getContentById, createContent, updateContentStatus, deleteContent } from "../controllers/contentController.js";

const router = Router();
router.get("/", getAllContents);
router.get("/:id", getContentById);
router.post("/", createContent);
router.put("/:id", updateContentStatus);
router.delete("/:id", deleteContent);

export default router;