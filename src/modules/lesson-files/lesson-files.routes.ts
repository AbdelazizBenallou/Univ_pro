import { Router } from "express";
import { lessonFilesController } from "./lesson-files.controller.js";
import { verifyAccessToken } from "../../../framework/middleware/verifyAccessToken.js";
import { zodValidateQuery } from "../../../framework/middleware/zodValidate.js";
import { listLessonFilesSchema } from "./lesson-files.validator.js";
import { requireLevelAccess } from "../../../framework/middleware/requireLevelAccess.js";
import {
  lessonFileUploadRateLimit,
  lessonFileDownloadRateLimit,
  lessonFileDeleteRateLimit,
} from "../../../framework/middleware/rateLimiter.js";
import { handleMulterError } from "../../../framework/middleware/uploadErrorHandler.js";
import { lessonFileUpload, lessonFileBatchUpload } from "../../../framework/middleware/upload.js";
import { zodValidate } from "../../../framework/middleware/zodValidate.js";
import { uploadLessonFileSchema, uploadLessonFilesSchema } from "./lesson-files.validator.js";

const router = Router();

/**
 * @openapi
 * /v1/lesson-files:
 *   get:
 *     tags: [Lesson Files]
 *     summary: List lesson files by module and activity type
 *     description: Returns paginated lesson files filtered by module_id, activity_type_id, and season_id.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *       - in: query
 *         name: activity_type_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Activity type ID (1=Lesson, 2=TD, 3=TP, 4=Exam, 5=Controle)
 *       - in: query
 *         name: season_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season ID (1=2020-2021 through 6=2025-2026)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: perPage
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Lesson files fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       url:
 *                         type: string
 *                       file_type:
 *                         type: string
 *                       module_id:
 *                         type: integer
 *                       activity_type_id:
 *                         type: integer
 *                       activity_type:
 *                         type: string
 *                       season_id:
 *                         type: integer
 *                       uploaded_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  verifyAccessToken,
  zodValidateQuery(listLessonFilesSchema),
  lessonFilesController.findAll
);

/**
 * @openapi
 * /v1/lesson-files/upload:
 *   post:
 *     tags: [Lesson Files]
 *     summary: Upload a lesson file
 *     description: Uploads a file to MinIO and creates a lesson_files record. Super Admin can upload to any level. Admin can only upload to their assigned levels.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - module_id
 *               - activity_type_id
 *               - season_id
 *               - name
 *               - file
 *             properties:
 *               module_id:
 *                 type: integer
 *               activity_type_id:
 *                 type: integer
 *               season_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/upload",
  verifyAccessToken,
  lessonFileUploadRateLimit,
  (req, res, next) => {
    lessonFileUpload.single("file")(req, res, (err) => handleMulterError(err, req, res, next));
  },
  requireLevelAccess("body"),
  zodValidate(uploadLessonFileSchema),
  lessonFilesController.upload,
);

/**
 * @openapi
 * /v1/lesson-files/upload/batch:
 *   post:
 *     tags: [Lesson Files]
 *     summary: Upload multiple lesson files
 *     description: Uploads multiple files. Names derived from original filenames. Skips duplicates (by name) within the same module/activity/season.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - module_id
 *               - activity_type_id
 *               - season_id
 *               - files
 *             properties:
 *               module_id:
 *                 type: integer
 *               activity_type_id:
 *                 type: integer
 *               season_id:
 *                 type: integer
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files processed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/upload/batch",
  verifyAccessToken,
  lessonFileUploadRateLimit,
  (req, res, next) => {
    lessonFileBatchUpload.array("files", 50)(req, res, (err) => handleMulterError(err, req, res, next));
  },
  requireLevelAccess("body"),
  zodValidate(uploadLessonFilesSchema),
  lessonFilesController.uploadBatch,
);

/**
 * @openapi
 * /v1/lesson-files/{id}/download:
 *   get:
 *     tags: [Lesson Files]
 *     summary: Get download URL for a lesson file
 *     description: Returns a presigned MinIO URL valid for 1 hour. Also tracks the download.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson file ID
 *     responses:
 *       200:
 *         description: Download URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     file_type:
 *                       type: string
 *                     download_url:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.get(
  "/:id/download",
  verifyAccessToken,
  lessonFileDownloadRateLimit,
  lessonFilesController.download,
);

/**
 * @openapi
 * /v1/lesson-files/{id}:
 *   delete:
 *     tags: [Lesson Files]
 *     summary: Delete a lesson file
 *     description: Deletes from MinIO and database. Super Admin can delete any; Admin only their assigned levels.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Lesson file ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: File not found
 */
router.delete(
  "/:id",
  verifyAccessToken,
  requireLevelAccess("lessonFileParam"),
  lessonFileDeleteRateLimit,
  lessonFilesController.remove,
);

export default router;
