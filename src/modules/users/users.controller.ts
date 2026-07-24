import type { Request, Response } from "express";
import { usersService } from "./users.service.js";
import { response } from "../../../framework/utils/response.js";
import type { ListUsersInput, UpdateProfileInput } from "./users.validator.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";

export const usersController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const data = await usersService.getAll(req.query as unknown as ListUsersInput);

    response.success(res, data, "Users fetched successfully");
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    const data = await usersService.getById(id);

    response.success(res, data, "User fetched successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    const data = await usersService.update(id, req.body);

    response.success(res, data, "User updated successfully");
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      response.error(res, "Invalid user ID", 400);
      return;
    }

    await usersService.remove(id);

    response.success(res, null, "User deleted successfully");
  }),

  getMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const data = await usersService.getMyProfile(req.user!.userId);

    response.success(res, data, "Profile fetched successfully");
  }),

  updateMyProfile: asyncHandler(async (req: Request, res: Response) => {
    const data = await usersService.updateMyProfile(req.user!.userId, req.body as UpdateProfileInput);

    response.success(res, data, "Profile updated successfully");
  }),
};
