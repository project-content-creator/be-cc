import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { requireRole } from "../middlewares/middleware.js";

const router = Router();
// Manajemen user hanya untuk admin. Pengecualian: user boleh melihat/mengubah profilnya sendiri (dicek di controller).
router.get("/", requireRole("admin"), getAllUsers);
router.get("/:id", getUserById);
router.post("/", requireRole("admin"), createUser);
router.put("/:id", updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

export default router;
