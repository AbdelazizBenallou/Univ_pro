import { Router } from "express";
import { academicProgramController } from "./academic-programs.controller.js";

const router = Router();

/**
 * @openapi
 * /v1/academic-programs:
 *   get:
 *     tags: [Academic Programs]
 *     summary: Get all academic programs
 *     description: Returns all academic programs with their nested levels and specialities. Used during registration to populate dropdowns.
 *     responses:
 *       200:
 *         description: Academic programs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AcademicProgram'
 */
router.get("/", academicProgramController.findAll);

export default router;
