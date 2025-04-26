import express from "express";
import {
    authenticateUser,
    changeUserPassword,
    createUserAccount,
    deleteUserAccount,
    getCurrentUserProfile,
    signOutUser,
    updateUserProfile
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.js";
import { validateSignup, validateSignin, validatePasswordChange } from "../middleware/validation.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/user/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:  
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.post("/signup", validateSignup, createUserAccount);


/**
 * @swagger
 * /api/v1/user/signin:
 *   post:
 *     summary: Authenticate user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:                  
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */                 
router.post("/signin", validateSignin, authenticateUser);

/**
 * @swagger                     
 * /api/v1/user/signout:    
 *   post:
 *     summary: Sign out user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User signed out successfully
 *       400:
 *         description: Bad Request
 */
router.post("/signout", signOutUser);

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:       
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       400:
 *         description: Bad Request
 */
router.get("/profile", isAuthenticated, getCurrentUserProfile);

/**
 * @swagger
 * /api/v1/user/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad Request
 */
router.patch("/profile",
    isAuthenticated,
    upload.single("avatar"),
    updateUserProfile
);

/**
 * @swagger
 * /api/v1/user/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User password changed successfully
 */ 
router.patch("/change-password",
    isAuthenticated,
    validatePasswordChange,
    changeUserPassword
);

/**
 * @swagger
 * /api/v1/user/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 */
router.delete("/account", isAuthenticated, deleteUserAccount);

export default router;