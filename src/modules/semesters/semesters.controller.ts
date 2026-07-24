import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { semesterService } from "./semesters.service.js";

export const semesterController = {
  findByLevel: asyncHandler(async (req: Request, res: Response) => {
    const levelId = Number(req.query.level_id);
    if (isNaN(levelId)) {
      response.error(res, "level_id is required", 400);
      return;
    }
    const data = await semesterService.findByLevelId(levelId);
    response.success(res, data, "Semesters fetched successfully");
  }),
};
