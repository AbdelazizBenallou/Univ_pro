import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { seasonService } from "./seasons.service.js";

export const seasonController = {
  findAll: asyncHandler(async (_req: Request, res: Response) => {
    const data = await seasonService.findAll();
    response.success(res, data, "Seasons fetched successfully");
  }),
};
