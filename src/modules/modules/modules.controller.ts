import type { Request, Response } from "express";
import { response } from "../../../framework/utils/response.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { moduleService } from "./modules.service.js";

export const moduleController = {
  findLicense: asyncHandler(async (req: Request, res: Response) => {
    const { semester_id } = (req as any).validatedQuery;

    const data = await moduleService.findBySemester(semester_id);
    response.success(res, data, "Modules fetched successfully");
  }),

  findMaster: asyncHandler(async (req: Request, res: Response) => {
    const { semester_id, speciality_id } = (req as any).validatedQuery;

    const data = await moduleService.findBySemester(semester_id, speciality_id);
    response.success(res, data, "Modules fetched successfully");
  }),

  getComponents: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      response.error(res, "Invalid module ID", 400);
      return;
    }

    const data = await moduleService.findComponentsByModuleId(id);
    response.success(res, data, "Module components fetched successfully");
  }),
};
