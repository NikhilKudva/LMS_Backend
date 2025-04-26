import express from "express";
import { isAuthenticated, restrictTo } from "../middleware/auth.middleware.js";
import {
  createNewCourse,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourse,
  getCourseLectures,
  addCourseRating,
  getAvgCourseRatings,
} from "../controllers/course.controller.js";
import upload from "../utils/multer.js";
const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management
 */

/**
 * @swagger
 * /api/v1/course/published:
 *   get:
 *     summary: Get all published courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: A list of published courses
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
router.get("/published", getPublishedCourses);

/**
 * @swagger
 * /api/v1/course/search:
 *   get:
 *     summary: Search for courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query string
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 */
router.get("/search", searchCourses);


router.use(isAuthenticated);

/**
 * @swagger
 * /api/v1/course:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post(
  "/",
  upload.single("thumbnail"),
  createNewCourse
);

/**
 * @swagger
 * /api/v1/course:
 *   get:
 *     summary: Get instructor's created courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of instructor's courses
 */
router.get(
  "/",
  getMyCreatedCourses
);

/**
 * @swagger
 * /api/v1/course/c/{courseId}:
 *   get:
 *     summary: Get course details
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 */
router.get(
  "/c/:courseId",
  getCourseDetails
);

/**
 * @swagger
 * /api/v1/course/c/{courseId}:
 *   patch:
 *     summary: Update course details
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:  
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:    
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *                 format: binary 
 *     responses:
 *       200:
 *         description: Course updated successfully
 */ 
router.patch(
    "/c/:courseId",
    restrictTo("instructor"),
    upload.single("thumbnail"),
    updateCourseDetails
  );

  /**
   * @swagger
   * /api/v1/course/c/{courseId}/lectures:
   *   get:
   *     summary: Get course lectures
   *     tags: [Courses]  
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *     responses: 
   *       200:
   *         description: Course lectures
   */
  router.get(
    "/c/:courseId/lectures",
    getCourseLectures
  );


  /**
   * @swagger
   * /api/v1/course/c/{courseId}/lectures:
   *   post:
   *     summary: Add lecture to course
   *     tags: [Courses]  
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true   
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:    
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string 
   *               video:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Lecture added successfully  
   */
  router.post(
    "/c/:courseId/lectures",
    restrictTo("instructor"),
    upload.single("video"),
    addLectureToCourse
  );

/**
 * @swagger
 * /api/v1/course/c/{courseId}/ratings:
 *   post:
 *     summary: Add course rating
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rating added successfully
 */
router.post(
  "/c/:courseId/ratings",
  restrictTo("user"),
  addCourseRating
);

/**
 * @swagger
 * /api/v1/course/c/{courseId}/ratings:
 *   get:
 *     summary: Get course average ratings
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course average ratings
 */                 
router.get(
  "/c/:courseId/ratings",
  getAvgCourseRatings
);


export default router;
