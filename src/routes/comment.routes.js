import { Router } from "express";
import {authMiddleware ,verifyEmail} from "../middlewares/auth.middleware.js";

import { createComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(verifyEmail);

router.post("/:postId", createComment);

export default router;