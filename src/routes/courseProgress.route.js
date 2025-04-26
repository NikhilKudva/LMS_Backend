import express from "express"
import { isAuthenticated } from "../middleware/auth.middleware.js";
import {
    getUserCourseProgress,
    updateLectureProgress,
    markCourseAsCompleted,
    resetCourseProgress
} from "../controllers/courseProgress.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/course-progress/:courseId:
 *   get:
 *     summary: Get course progress
 *     tags: [Course Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course progress
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */ 
router.get("/:courseId", isAuthenticated, getUserCourseProgress);

/**
 * @swagger
 * /api/v1/course-progress/:courseId/lectures/:lectureId:
 *   patch:
 *     summary: Update lecture progress
 *     tags: [Course Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lecture progress updated
 *       400:
 *         description: Bad Request
 */
router.patch("/:courseId/lectures/:lectureId", isAuthenticated, updateLectureProgress);

/**
 * @swagger
 * /api/v1/course-progress/:courseId/complete:
 *   patch:
 *     summary: Mark course as completed
 *     tags: [Course Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course marked as completed
 */
router.patch("/:courseId/complete", isAuthenticated, markCourseAsCompleted);

/**
 * @swagger
 * /api/v1/course-progress/:courseId/reset:
 *   patch:
 *     summary: Reset course progress
 *     tags: [Course Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course progress reset
 */
router.patch("/:courseId/reset", isAuthenticated, resetCourseProgress);

export default router;