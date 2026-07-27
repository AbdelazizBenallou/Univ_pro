import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { semesterService } from "./semesters.service.js";

export const semesterController = {
  findByLevel: asyncHandler(async (req: Request, res: Response) => {
    const { level_id } = (req as any).validatedQuery;
    const data = await semesterService.findByLevelId(level_id);
    response.success(res, data, "Semesters fetched successfully");
  }),
};
