import { Router } from "express";
import { authController } from "./auth.controller.js";
import { loginSchema, refreshTokenSchema, registerSchema, verifyEmailSchema, resendCodeSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema, changePasswordSchema } from "./auth.validator.js";
import { verifyRefreshToken } from "../../../framework/middleware/verifyRefreshToken.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";

const router = Router();

/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account
 *     description: Creates a new user with pending status and sends a 6-digit verification code to the email. If the email already exists, returns the current status (pending or active).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name, gender, level_id, device_fingerprint, device_name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@univ.dz
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Min 8 chars, must contain uppercase, lowercase, and a number
 *                 example: MyPass123
 *               first_name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Ahmed
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Benali
 *               gender:
 *                 type: string
 *                 enum: [Male, Female]
 *               level_id:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: 1=L1, 2=L2, 3=L3, 4=M1, 5=M2
 *               speciality_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Required for Master levels (4, 5)
 *               device_fingerprint:
 *                 type: string
 *                 description: Unique device identifier
 *               device_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: Samsung Galaxy S24
 *     responses:
 *       201:
 *         description: Verification code sent to your email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [pending, active]
 *       429:
 *         description: Too many register attempts
 */
router.post(
  "/register",
  zodValidate(registerSchema),
  authController.register
);

/**
 * @openapi
 * /v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with code
 *     description: Enter the 6-digit code received by email. Code expires after 5 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 example: "482916"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired code / Email already verified
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many verification attempts
 */
router.post(
  "/verify-email",
  zodValidate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @openapi
 * /v1/auth/resend-code:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification code
 *     description: Invalidates any unused code and sends a new one. Maximum 3 codes per day per user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code resent to your email
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 *       429:
 *         description: Maximum 3 verification codes per day
 */
router.post(
  "/resend-code",
  zodValidate(resendCodeSchema),
  authController.resendCode
);

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Authenticates the user. Checks activation status, device fingerprint, then password. Returns access token (60min) and refresh token (7 days). Both are set as httpOnly cookies and returned in the response body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, device_fingerprint]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               device_fingerprint:
 *                 type: string
 *                 description: Must match a device registered during signup
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         user:
 *                           $ref: '#/components/schemas/LoginUser'
 *       401:
 *         description: Invalid credentials / Account not active
 *       403:
 *         description: Device not recognized
 *       429:
 *         description: Too many login attempts
 */
router.post(
  "/login",
  zodValidate(loginSchema),
  authController.login
);

/**
 * @openapi
 * /v1/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Sends a valid refresh token to receive a new access token (60 min). The refresh token itself is not rotated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *       403:
 *         description: Refresh token expired / invalid / User not active
 */
router.post(
  "/refresh-token",
  zodValidate(refreshTokenSchema),
  verifyRefreshToken,
  authController.refreshToken
);

/**
 * @openapi
 * /v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset code
 *     description: Sends a 6-digit reset code to the user's email. Maximum 3 codes per day per user. Code expires in 5 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset code sent to your email
 *       400:
 *         description: Account is not active
 *       404:
 *         description: User not found
 *       429:
 *         description: Maximum 3 codes per day
 */
router.post(
  "/forgot-password",
  zodValidate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @openapi
 * /v1/auth/verify-reset-code:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset code
 *     description: Verifies the 6-digit code from forgot-password. Returns a short-lived reset token (10 min) to be used with /reset-password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *                 example: "482916"
 *     responses:
 *       200:
 *         description: Code verified, reset token returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         resetToken:
 *                           type: string
 *       400:
 *         description: Invalid or expired code / Account not active
 *       404:
 *         description: User not found
 */
router.post(
  "/verify-reset-code",
  zodValidate(verifyResetCodeSchema),
  authController.verifyResetCode
);

/**
 * @openapi
 * /v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Sets a new password using the reset token from /verify-reset-code. Token expires after 10 minutes. Revokes ALL existing refresh tokens — user must login again on all devices.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from /verify-reset-code
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Min 8 chars, must contain uppercase, lowercase, and a number
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token / Account not active
 *       404:
 *         description: User not found
 */
router.post(
  "/reset-password",
  zodValidate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @openapi
 * /v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password (logged in)
 *     description: Requires a valid access token. Verifies the old password, sets the new one, and revokes ALL refresh tokens — user must login again on all devices.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Min 8 chars, must contain uppercase, lowercase, and a number. Must differ from old password.
 *     responses:
 *       200:
 *         description: Password changed successfully. Please login again.
 *       400:
 *         description: New password same as old / validation error
 *       401:
 *         description: Invalid current password / Unauthorized / Token expired
 */
router.post(
  "/change-password",
  verifyAccessToken,
  zodValidate(changePasswordSchema),
  authController.changePassword
);

/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     description: Revokes the given refresh token (if provided) and clears httpOnly cookies. Safe to call even with an expired/missing refresh token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional. If provided, this specific refresh token is revoked.
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authController.logout);

export default router;
