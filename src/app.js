import express from 'express';
import cors from 'cors';

import router from "./routes/authRoutes.js";

import userRoutes from "./routes/userRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", router);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/channel", channelRoutes);
app.use("/api/v1/content", contentRoutes);

export default app;