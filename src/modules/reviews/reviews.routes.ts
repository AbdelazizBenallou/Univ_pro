import { Router } from "express";
import { reviewController } from "./reviews.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidate, zodValidateQuery } from "../../../framework/middleware/zodValidate.js";
import { createReviewSchema, listReviewsSchema } from "./reviews.validator.js";
import {
  createReviewRateLimit,
  listReviewsRateLimit,
} from "../../../framework/middleware/rateLimiter.js";

const router = Router();

/**
 * @openapi
 * /v1/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a review
 *     description: Creates a text review for the authenticated user. Users can submit multiple reviews. Reviews cannot be edited or deleted.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 example: Great platform, very useful resources!
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
router.post(
  "/",
  verifyAccessToken,
  createReviewRateLimit,
  zodValidate(createReviewSchema),
  reviewController.create
);

/**
 * @openapi
 * /v1/reviews/me:
 *   get:
 *     tags: [Reviews]
 *     summary: Get my review
 *     description: Returns the authenticated user's most recent review.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Review fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found
 */
router.get("/me", verifyAccessToken, reviewController.getMine);

/**
 * @openapi
 * /v1/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List all reviews
 *     description: Returns a paginated list of all reviews with the author's public profile.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Reviews fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  verifyAccessToken,
  listReviewsRateLimit,
  zodValidateQuery(listReviewsSchema),
  reviewController.list
);

export default router;
