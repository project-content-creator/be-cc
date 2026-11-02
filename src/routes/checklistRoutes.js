import { Router } from "express";
import { toggleChecklistItemStatus, deleteChecklistItem } from "../controllers/checklistController.js";

const router = Router();
router.patch("/:id/toggle", toggleChecklistItemStatus);
router.delete("/:id", deleteChecklistItem);

export default router;
