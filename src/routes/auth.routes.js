import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  forgetPassword,
  verifyEmail,
  resetPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.post("/forget-password", forgetPassword);
router.post("/verify-email", verifyEmail);
router.post("/reset-password", resetPassword);

export default router;
