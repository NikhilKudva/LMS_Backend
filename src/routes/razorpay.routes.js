import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
} from "../controllers/razorpay.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/razorpay/create-order:
 *   post:
 *     summary: Create a Razorpay order
 *     tags: [Razorpay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */     
router.post("/create-order", isAuthenticated, createRazorpayOrder);

/**
 * @swagger
 * /api/v1/razorpay/verify-payment:
 *   post:
 *     summary: Verify a Razorpay payment
 *     tags: [Razorpay]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Razorpay payment verified successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */   
router.post("/verify-payment", isAuthenticated, verifyPayment);

export default router;
