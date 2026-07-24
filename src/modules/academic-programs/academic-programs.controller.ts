import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { academicProgramService } from "./academic-programs.service.js";

export const academicProgramController = {
  findAll: asyncHandler(async (_req: Request, res: Response) => {
    const data = await academicProgramService.findAll();
    response.success(res, data, "Academic programs fetched successfully");
  }),
};
