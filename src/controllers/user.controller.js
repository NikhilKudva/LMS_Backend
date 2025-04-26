import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import crypto from "crypto";
import { prisma } from "../database/db.js";

export const createUserAccount = catchAsync(async (req, res) => {
  const { name, email, password, role = "student" } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingUser) {
    throw new AppError("User already exists with this email", 400);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password,
      role,
    },
  });
  await user.updateLastActive();
  generateToken(res, user._id, "Account created successfully");
}); 

export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { password: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  await user.updateLastActive();
  generateToken(res, user.id, `Welcome back ${user.name}`);
});

export const signOutUser = catchAsync(async (_, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Signed out successfully",
  });
});

export const getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.id },
    include: {
      enrolledCourses: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses,
    },
  }); 
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = { name, email: email?.toLowerCase(), bio };

  if (req.file) {
    const avatarResult = await uploadMedia(req.file.path);
    updateData.avatar = avatarResult?.secure_url || req.file.path;

    const user = await prisma.user.findUnique({
      where: { id: req.id },
    });
    if (user.avatar && user.avatar !== "default-avatar.png") {
      await deleteMediaFromCloudinary(user.avatar);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.id },
    data: updateData,
  });

  if (!updatedUser) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const changeUserPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.id },
    select: { password: true },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError("No user found with this email", 404);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Password reset instructions sent to email",
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      resetPasswordToken: crypto
        .createHash("sha256")
        .update(token)
        .digest("hex"),
      resetPasswordExpire: { $gt: Date.now() },
    },
  });

  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

export const deleteUserAccount = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.id },
  });

  if (user.avatar && user.avatar !== "default-avatar.png") {
    await deleteMediaFromCloudinary(user.avatar);
  }

  await prisma.user.delete({
    where: { id: req.id },
  });

  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});