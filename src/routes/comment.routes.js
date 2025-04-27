import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import { createComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:postId", createComment);

export default router;