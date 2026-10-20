import { Router } from "express";
import {getAllChannels, getChannelById, createChannel, updateChannel, deleteChannel} from "../controllers/channelController.js";

const router = Router();
router.get("/", getAllChannels);
router.get("/:id", getChannelById);
router.post("/", createChannel);
router.put("/:id", updateChannel);
router.delete("/:id", deleteChannel);

export default router;