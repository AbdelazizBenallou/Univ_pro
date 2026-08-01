import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { reviewService } from "./reviews.service.js";

export const reviewController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await reviewService.create(req.user!.userId, req.body.comment);
    response.success(res, data, "Review submitted successfully", 201);
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    const data = await reviewService.getMy(req.user!.userId);
    response.success(res, data, "Review fetched successfully");
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery;
    const data = await reviewService.list(query.page, query.perPage);
    response.success(res, data, "Reviews fetched successfully");
  }),
};
