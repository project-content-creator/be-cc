import { Router } from "express";
import { login, register, me } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/middleware.js";

const router = Router();
router.post("/login", login);
router.post("/register", register);
router.get("/me", verifyToken, me);

export default router;
