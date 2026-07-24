import { Router } from "express";
import { semesterController } from "./semesters.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";

const router = Router();

/**
 * @openapi
 * /v1/semesters:
 *   get:
 *     tags: [Semesters]
 *     summary: Get semesters by level
 *     description: Returns semesters for a given level. Each level has 2 semesters.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Level ID (1=L1, 2=L2, 3=L3, 4=M1, 5=M2)
 *     responses:
 *       200:
 *         description: Semesters fetched successfully
 *       400:
 *         description: level_id is required
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyAccessToken, semesterController.findByLevel);

export default router;
