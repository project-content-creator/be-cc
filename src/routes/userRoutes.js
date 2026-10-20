import {getAllUsers, getUserById, createUser, updateUser, deleteUser} from "../controllers/userController.js";
import { Router } from "express";

const router = Router();
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
export default router;