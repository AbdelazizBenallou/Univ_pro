import type { Request, Response } from "express";
import { subscriptionsService } from "./subscriptions.service.js";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";

export const subscriptionsController = {
  listDemands: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const query = (req as any).validatedQuery;
    const data = await subscriptionsService.listDemands(user.userId, user.roles ?? [], query);
    response.success(res, data, "Subscription demands fetched successfully");
  }),

  createDemand: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const data = await subscriptionsService.createDemand(user.userId, req.body);
    response.success(res, data, "Subscription demand created successfully", 201);
  }),

  processDemand: asyncHandler(async (req: Request, res: Response) => {
    const demandId = Number(req.params.id);
    if (isNaN(demandId) || demandId < 1) {
      response.error(res, "Invalid demand ID", 400);
      return;
    }

    const user = req.user!;
    const data = await subscriptionsService.processDemand(demandId, user.userId, req.body);
    response.success(res, data, "Subscription demand processed successfully");
  }),

  listSubscriptions: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const query = (req as any).validatedQuery;
    const data = await subscriptionsService.listSubscriptions(user.userId, user.roles ?? [], query);
    response.success(res, data, "Subscriptions fetched successfully");
  }),

  getCurrent: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const data = await subscriptionsService.getCurrentSubscription(user.userId);
    response.success(res, data, "Current subscription fetched successfully");
  }),
};
