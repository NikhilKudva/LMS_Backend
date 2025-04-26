import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

export const generateToken = (res, user, message) => {
  const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user,
    });
};
