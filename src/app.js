import express from 'express';
import cors from 'cors';

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";
import { verifyToken } from "./middlewares/middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

// /auth/login dan /auth/register terbuka; semua rute lain wajib membawa token (lihat authRoutes untuk /auth/me).
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", verifyToken, userRoutes);
app.use("/api/v1/channel", verifyToken, channelRoutes);
app.use("/api/v1/content", verifyToken, contentRoutes);
app.use("/api/v1/checklists", verifyToken, checklistRoutes);

app.use((req, res) => {
  res.status(404).json({ status: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: false, message: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ status: false, message: "Internal Server Error" });
});

export default app;
