import type { Request, Response } from "express";
import { lessonFilesService } from "./lesson-files.service.js";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";

export const lessonFilesController = {
  findAll: asyncHandler(async (req: Request, res: Response) => {
    const data = await lessonFilesService.findAll((req as any).validatedQuery, req.user!);

    response.success(res, data, "Lesson files fetched successfully");
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      response.error(res, "No file uploaded", 400);
      return;
    }

    const input = req.body;
    const data = await lessonFilesService.upload(input, file);

    response.success(res, data, "File uploaded successfully", 201);
  }),

  uploadBatch: asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || !files.length) {
      response.error(res, "No files uploaded", 400);
      return;
    }

    const input = req.body;
    const data = await lessonFilesService.uploadBatch(input, files);

    response.success(res, data, "Files processed successfully", 201);
  }),

  download: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) {
      response.error(res, "Invalid file ID", 400);
      return;
    }

    const user = req.user!;

    const data = await lessonFilesService.download(id, user);

    response.success(res, data, "Download URL generated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) {
      response.error(res, "Invalid file ID", 400);
      return;
    }

    await lessonFilesService.remove(id);

    response.success(res, null, "File deleted successfully");
  }),
};
