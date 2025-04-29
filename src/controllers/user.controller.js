import User from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../utils/hashPassword.util.js";
import { successResponse, errorResponse } from "../utils/ApiResponse.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generatePasswordResetToken,
  generateVerificationToken,
} from "../utils/token.util.js";
import ENV from "../config/env.config.js";
import { sendEmail } from "../utils/email.util.js";
import {
  cloudinaryUpload,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";

export const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;
  let publicId = null;
  if (!name || !username || !email || !password) {
    return errorResponse(
      res,
      new Error("Missing required fields"),
      "Please provide all required fields",
      400
    );
  }

  if (!email.includes("@")) {
    return errorResponse(
      res,
      new Error("Invalid email format"),
      "Please provide a valid email",
      400
    );
  }
  if (password.length < 6) {
    return errorResponse(
      res,
      new Error("Password too short"),
      "Password must be at least 6 characters long",
      400
    );
  }
  if (password.length > 20) {
    return errorResponse(
      res,
      new Error("Password too long"),
      "Password must be at most 20 characters long",
      400
    );
  }

  try {
    const profilePictureLocalPath = req.file.path;
    console.log("Profile picture local path:", profilePictureLocalPath);

    if (!profilePictureLocalPath) {
      return errorResponse(
        res,
        new Error("Missing required fields"),
        "Please provide profile picture",
        400
      );
    }

    const response1 = await cloudinaryUpload(profilePictureLocalPath, {
      folder: "profile_pictures",
    });

    console.log("Cloudinary response:", response1);

    const { secure_url, public_id } = response1;

    if (secure_url) {
      publicId = public_id; // Extract public ID from URL
    } else {
      return errorResponse(
        res,
        new Error("Error uploading profile picture"),
        "Error uploading profile picture",
        500
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(
        res,
        new Error("User already exists"),
        "Email is already registered",
        409
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
      profilePicture: secure_url,
      profilePicturePublicId: public_id,
    });

    const verificationToken = generateVerificationToken(user._id.toString(), {
      expiresIn: "1d",
    });

    const verificationUrl = `${ENV.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const title = "Email Verification";
    const message = `Please verify your email by clicking the link below: ${verificationUrl}`;
    const buttonText = "Verify Email";
    const response = await sendEmail({
      to: user.email,
      subject: title,
      title,
      message,
      buttonText,
      buttonUrl: verificationUrl,
    });
    if (response.error) {
      return errorResponse(
        res,
        new Error("Failed to send verification email"),
        "Failed to send verification email",
        500
      );
    }
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 1 day

    await user.save();

    return successResponse(
      res,
      { id: user._id, username, email },
      "User registered successfully",
      201
    );
  } catch (err) {
    if (publicId) {
      await deleteFileFromCloudinary(publicId, "image");
    }

    return errorResponse(res, err, "Registration failed");
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(
      res,
      new Error("Missing required fields"),
      "Please provide all required fields",
      400
    );
  }

  try {
    const checkUser = await User.findOne({ email });
    if (!checkUser) {
      return errorResponse(
        res,
        new Error("User not found"),
        "Invalid credentials",
        401
      );
    }

    const isMatch = await verifyPassword(checkUser.password, password);
    if (!isMatch) {
      return errorResponse(
        res,
        new Error("Password incorrect"),
        "Invalid credentials",
        401
      );
    }

    const userId = checkUser._id.toString();
    const accessToken = generateAccessToken(
      userId,
      checkUser.role,
      checkUser.isVerified,
      { expiresIn: "15m" }
    );
    const refreshToken = generateRefreshToken(
      userId,
      checkUser.role,
      checkUser.isVerified,
      { expiresIn: "7d" }
    );

    const updatedUser = await User.updateOne(
      { _id: checkUser._id },
      { refreshToken }
    ).select("-password");
    if (updatedUser.modifiedCount === 0) {
      return errorResponse(
        res,
        new Error("Failed to save refresh token"),
        "Internal server error",
        500
      );
    }

    // Set refresh token as http-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    const user = await User.findById(userId).select(
      "-password -refreshToken -verificationToken -verificationTokenExpiry -forgetPasswordToken -forgetPasswordTokenExpiry -profilePicturePublicId "
    );

    return successResponse(res, { user, accessToken }, "Login successful", 200);
  } catch (err) {
    return errorResponse(res, err, "Login failed");
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return errorResponse(
        res,
        new Error("Refresh token not found"),
        "Unauthorized",
        401
      );
    }

    const decoded = verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const newAccessToken = generateAccessToken(
      decoded.id,
      decoded.role,
      decoded.isVerified,
      {
        expiresIn: "15m",
      }
    );

    return successResponse(
      res,
      { accessToken: newAccessToken },
      "Access token refreshed"
    );
  } catch (err) {
    return errorResponse(res, err, "Failed to refresh access token", 500);
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 0,
  });
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 0,
  });

  return successResponse(res, null, "Successfully logged out");
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }

    return successResponse(res, user, "User profile retrieved successfully");
  } catch (err) {
    return errorResponse(res, err, "Failed to retrieve user profile", 500);
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, username, email } = req.body;

    if (!name || !username || !email) {
      return errorResponse(
        res,
        new Error("Missing required fields"),
        "Please provide all required fields",
        400
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, username, email },
      { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }

    return successResponse(
      res,
      updatedUser,
      "User profile updated successfully"
    );
  } catch (err) {
    return errorResponse(res, err, "Failed to update user profile", 500);
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedUser = await User.findByIdAndDelete(userId).select(
      "-password -refreshToken"
    );

    if (!deletedUser) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }

    return successResponse(res, null, "User profile deleted successfully");
  } catch (err) {
    return errorResponse(res, err, "Failed to delete user profile", 500);
  }
};

export const checkUsernameAvailability = async (req, res) => {
  const { username } = req.params;

  console.log(username);
  if (!username) {
    return errorResponse(
      res,
      new Error("Missing required fields"),
      "Please provide a username",
      400
    );
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return successResponse(
        res,
        { available: true },
        "Username is available",
        200
      );
    } else {
      return successResponse(
        res,
        { available: false },
        "Username is not available",
        200
      );
    }
  } catch (err) {
    return errorResponse(
      res,
      err,
      "Failed to check username availability",
      500
    );
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }
    const token = generatePasswordResetToken(user._id.toString(), {
      expiresIn: "15m",
    });

    // Send email with the token
    const resetUrl = `${ENV.CLIENT_URL}/reset-password/${token}`;
    const title = "Password Reset Request";
    const message = `You requested a password reset. Click the link below to reset your password: ${resetUrl}`;
    const buttonText = "Reset Password";
    const response = await sendEmail({
      to: user.email,
      subject: "Password Reset",
      title,
      message,
      buttonText,
      buttonUrl: resetUrl,
    });

    if (response.error) {
      return errorResponse(
        res,
        new Error("Failed to send email"),
        "Failed to send password reset email",
        500
      );
    }
    // Save the token to the user document

    user.forgetPasswordToken = token;
    user.forgetPasswordTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    return successResponse(res, null, "Password reset email sent successfully");
  } catch (err) {
    return errorResponse(res, err, "Failed to send password reset email", 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return errorResponse(
        res,
        new Error("Missing required fields"),
        "Please provide all required fields",
        400
      );
    }

    const decoded = verifyToken(token, ENV.PASSWORD_RESET_TOKEN_SECRET);

    if (!decoded) {
      return errorResponse(
        res,
        new Error("Invalid or expired token"),
        "Invalid or expired token",
        400
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }

    if (user.forgetPasswordToken !== token) {
      return errorResponse(
        res,
        new Error("Invalid or expired token"),
        "Invalid or expired token",
        400
      );
    }

    user.password = await hashPassword(newPassword);
    user.forgetPasswordToken = undefined;
    user.forgetPasswordTokenExpiry = undefined;
    await user.save();

    return successResponse(res, null, "Password reset successfully");
  } catch (err) {
    return errorResponse(res, err, "Failed to reset password", 500);
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return errorResponse(
        res,
        new Error("Missing required fields"),
        "Please provide all required fields",
        400
      );
    }

    const decoded = verifyToken(token, ENV.VERIFICATION_TOKEN_SECRET);

    if (!decoded) {
      return errorResponse(
        res,
        new Error("Invalid or expired token"),
        "Invalid or expired token",
        400
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(
        res,
        new Error("User not found"),
        "User not found",
        404
      );
    }

    user.isVerified = true;
    await user.save();

    return successResponse(res, null, "Email verified successfully");
  } catch (err) {
    return errorResponse(res, err, "Failed to verify email", 500);
  }
};
