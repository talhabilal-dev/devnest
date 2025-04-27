import User from "../models/user.model.js";
import { hashPassword, verifyPassword } from "../utils/hashPassword.util.js";
import { successResponse, errorResponse } from "../utils/ApiResponse.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../utils/token.util.js";
import {
  cloudinaryUpload,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.js";

export const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return errorResponse(
      res,
      new Error("Missing required fields"),
      "Please provide all required fields",
      400
    );
  }
  try {
    const profilePictureLocalPath = req.file.path;

    if (!profilePictureLocalPath) {
      return errorResponse(
        res,
        new Error("Missing required fields"),
        "Please provide profile picture",
        400
      );
    }

    const { secure_url, public_id } = await cloudinaryUpload(
      profilePictureLocalPath,
      {
        folder: "profile_pictures",
      }
    );

    if (!secure_url) {
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
    });
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

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(
        res,
        new Error("User not found"),
        "Invalid credentials",
        401
      );
    }

    const isMatch = await verifyPassword(user.password, password);
    if (!isMatch) {
      return errorResponse(
        res,
        new Error("Password incorrect"),
        "Invalid credentials",
        401
      );
    }

    const payload = user._id.toString();
    const accessToken = generateAccessToken(payload, { expiresIn: "15m" });
    const refreshToken = generateRefreshToken(payload, { expiresIn: "7d" });

    const updatedUser = await User.updateOne(
      { _id: user._id },
      { refreshToken }
    );
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

    // Send access token in response body

    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("Access-Control-Expose-Headers", "Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    return successResponse(
      res,
      { accessToken, refreshToken },
      "Login successful"
    );
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

    const newAccessToken = generateAccessToken(decoded.id, {
      expiresIn: "15m",
    });

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

  try {
    const user = await User.findOne({ username });
    if (user) {
      return successResponse(res, null, "Username is available", 200);
    } else {
      return successResponse(res, null, "Username is not available", 200);
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
