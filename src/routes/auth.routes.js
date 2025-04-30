import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  forgetPassword,
  verifyEmail,
  resetPassword,
  checkUsernameAvailability,
  getUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.post("/forget-password", forgetPassword);
router.post("/verify-email/:token", verifyEmail);
router.post("/reset-password", resetPassword);
router.post("/check-username/:username", checkUsernameAvailability);
router.get("/profile", authMiddleware, getUserProfile);

export default router;
