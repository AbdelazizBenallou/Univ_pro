import { Router } from "express";
import { seasonController } from "./seasons.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";

const router = Router();

/**
 * @openapi
 * /v1/seasons:
 *   get:
 *     tags: [Seasons]
 *     summary: Get all seasons
 *     description: Returns all academic year seasons (e.g. 2024-2025).
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Seasons fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyAccessToken, seasonController.findAll);

export default router;
