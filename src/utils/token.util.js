import jwt from "jsonwebtoken";
import ENV from "../config/env.config.js";

const generateAccessToken = (userId, options) => {
  const payload = { id: userId };
  const secret = ENV.ACCESS_TOKEN_SECRET;
  return jwt.sign(payload, secret, options);
};

const generateRefreshToken = (userId, options) => {
  const payload = { id: userId };
  const secret = ENV.REFRESH_TOKEN_SECRET;
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    throw new Error("Token verification failed");
  }
};

const generatePasswordResetToken = (userId, options) => {
  const payload = { id: userId };
  const secret = ENV.PASSWORD_RESET_TOKEN_SECRET;
  return jwt.sign(payload, secret, options);
};

const generateVerificationToken = (userId, options) => {
  const payload = { id: userId };
  const secret = ENV.VERIFICATION_TOKEN_SECRET;
  return jwt.sign(payload, secret, options);
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generatePasswordResetToken,
  generateVerificationToken
};
