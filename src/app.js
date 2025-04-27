import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
import ENV from "./config/env.config.js";
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to the Node-Auth");
});

export default app;
