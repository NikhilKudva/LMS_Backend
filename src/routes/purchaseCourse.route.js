import express from "express";
import {
  getCoursePurchaseStatus,
  getPurchasedCourses,
  handleStripeWebhook,
  initiateStripeCheckout,
} from "../controllers/coursePurchase.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/purchase-course/checkout/create-checkout-session:
 *   post:
 *     summary: Create a checkout session
 *     tags: [Purchase Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */       
router
  .route("/checkout/create-checkout-session")
  .post(isAuthenticated, initiateStripeCheckout);

/**
 * @swagger
 * /api/v1/purchase-course/webhook:
 *   post:
 *     summary: Handle Stripe webhook
 *     tags: [Purchase Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe webhook handled successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
  */
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

/**
 * @swagger
 * /api/v1/purchase-course/course/:courseId/detail-with-status:
 *   get:
 *     summary: Get course purchase status
 *     tags: [Purchase Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course purchase status
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.get("/", isAuthenticated, getPurchasedCourses);

/**
 * @swagger
 * /api/v1/purchase-course/course/:courseId/detail-with-status:
 *   get:
 *     summary: Get course purchase status
 *     tags: [Purchase Course]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course purchase status  
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */   
router.get("/course/:courseId/detail-with-status", isAuthenticated, getCoursePurchaseStatus);

export default router;
