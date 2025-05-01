import { Router } from "express";
import { authMiddleware, verifyEmail } from "../middlewares/auth.middleware.js";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  generatePost
} from "../controllers/post.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// router.use(authMiddleware);
// router.use(verifyEmail);

router.post("/", upload.single("coverImage"), createPost);
router.get("/", getPosts);
router.get("/:id", getPostById);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/generate", generatePost);

export default router;
