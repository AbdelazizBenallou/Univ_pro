import { Router } from "express";
import { moduleController } from "./modules.controller.js";
import { licenseModulesQuerySchema, masterModulesQuerySchema } from "./modules.validator.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidate.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";

const router = Router();

/**
 * @openapi
 * /v1/modules/license:
 *   get:
 *     tags: [Modules]
 *     summary: Get modules for License levels (L1-L3)
 *     description: Returns all modules for a given semester. Modules are general (no speciality).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Semester ID
 *     responses:
 *       200:
 *         description: Modules fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get("/license", verifyAccessToken, zodValidateQuery(licenseModulesQuerySchema), moduleController.findLicense);

/**
 * @openapi
 * /v1/modules/master:
 *   get:
 *     tags: [Modules]
 *     summary: Get modules for Master levels (M1-M2)
 *     description: Returns modules for a given semester filtered by speciality.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Semester ID
 *       - in: query
 *         name: speciality_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Speciality ID
 *     responses:
 *       200:
 *         description: Modules fetched successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get("/master", verifyAccessToken, zodValidateQuery(masterModulesQuerySchema), moduleController.findMaster);

/**
 * @openapi
 * /v1/modules/{id}/components:
 *   get:
 *     tags: [Modules]
 *     summary: Get module components
 *     description: Returns the activity types (Lesson, TD, TP, etc.) for a given module.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module components fetched successfully
 *       400:
 *         description: Invalid module ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Module not found
 */
router.get("/:id/components", verifyAccessToken, moduleController.getComponents);

export default router;
