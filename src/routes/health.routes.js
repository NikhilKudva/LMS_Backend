import express from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Check server health
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get('/', checkHealth);

export default router;
