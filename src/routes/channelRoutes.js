import { Router } from "express";
import { getAllChannels, getChannelById, createChannel, updateChannel, deleteChannel } from "../controllers/channelController.js";
import { requireRole } from "../middlewares/middleware.js";

const router = Router();
// Semua role boleh MELIHAT channel. Menambah/mengubah/menghapus: admin dan creator (creator hanya miliknya).
router.get("/", getAllChannels);
router.get("/:id", getChannelById);
router.post("/", requireRole("admin", "creator"), createChannel);
router.put("/:id", requireRole("admin", "creator"), updateChannel);
router.delete("/:id", requireRole("admin", "creator"), deleteChannel);

export default router;
