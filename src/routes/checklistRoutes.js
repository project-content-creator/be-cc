import { Router } from "express";
import {toggleChecklistItemStatus} from "../controllers/checklistController.js";

const router = Router();
router.patch("/:id/toggle", toggleChecklistItemStatus);

export default router;