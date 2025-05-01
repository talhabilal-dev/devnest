import { errorResponse } from "../utils/ApiResponse.util.js";
import { verifyToken } from "../utils/token.util.js";
import ENV from "../config/env.config.js";

const authMiddleware = (req, res, next) => {
  const token = req.cookies.accessToken || req.headers["authorization"];
  if (token && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token) {
    return errorResponse(
      res,
      new Error("No token provided"),
      "Unauthorized",
      401
    );
  }

  try {
    const decoded = verifyToken(token, ENV.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return errorResponse(
        res,
        new Error("Invalid token"),
        "Unauthorized",
        401
      );
    }

    req.user = decoded;

    next();
  } catch (err) {
    return errorResponse(res, err, "Unauthorized", 401);
  }
};

const verifyEmail = (req, res, next) => {
  console.log(req.user);
  authMiddleware(req, res, () => {
    if (!req.user.isVerified) {
      return errorResponse(
        res,
        new Error("Email not verified"),
        "Please verify your email address",
        401
      );
    }
    next();
  });
};

export { authMiddleware, verifyEmail };
