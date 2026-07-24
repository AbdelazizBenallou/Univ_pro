import { Router } from "express";
import { usersController } from "./users.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { checkPermission } from "../../../framework/middleware/checkPermission.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidateQuery.js";
import { listUsersSchema, updateUserSchema, updateProfileSchema } from "./users.validator.js";
import {
  listUsersRateLimit,
  getUserRateLimit,
  updateUserRateLimit,
  deleteUserRateLimit,
  getMyProfileRateLimit,
  updateMyProfileRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

// ─── /me/profile (authenticated user, no admin permission) ─────────────────

/**
 * @openapi
 * /v1/users/me/profile:
 *   get:
 *     tags: [Profile]
 *     summary: Get my profile
 *     description: Returns the authenticated user's full profile with level, speciality, phone provider, and social media links.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get(
  "/me/profile",
  verifyAccessToken,
  getMyProfileRateLimit,
  usersController.getMyProfile
);

/**
 * @openapi
 * /v1/users/me/profile:
 *   patch:
 *     tags: [Profile]
 *     summary: Update my profile
 *     description: Updates the authenticated user's profile. Only personal fields are editable (level, speciality, student_id are admin-only).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Ahmed
 *               last_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Benali
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 20
 *                 example: "0555100201"
 *               phone_provider_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Required if phone is provided
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "1995-06-15"
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *                 nullable: true
 *               address:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 500
 *               avatar:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.patch(
  "/me/profile",
  verifyAccessToken,
  updateMyProfileRateLimit,
  zodValidate(updateProfileSchema),
  usersController.updateMyProfile
);

// ─── Admin-only routes ─────────────────────────────────────────────────────

router.use(verifyAccessToken, checkPermission("manage_users"));

/**
 * @openapi
 * /v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     description: Returns a paginated list of users. Requires Admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Cursor for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page (1-100)
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get(
  "/",
  listUsersRateLimit,
  zodValidateQuery(listUsersSchema),
  usersController.getAll
);

/**
 * @openapi
 * /v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Returns a single user by their ID. Requires Admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserRateLimit, usersController.getById);

/**
 * @openapi
 * /v1/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user
 *     description: Updates a user's status and/or profile. Requires Admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, locked, suspended]
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id",
  updateUserRateLimit,
  zodValidate(updateUserSchema),
  usersController.update
);

/**
 * @openapi
 * /v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Permanently deletes a user by ID. Requires Admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
router.delete("/:id", deleteUserRateLimit, usersController.remove);

export default router;
