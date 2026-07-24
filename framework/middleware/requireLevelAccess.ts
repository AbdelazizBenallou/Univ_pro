import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { response } from "../utils/response.js";

export function requireLevelAccess(source: "body" | "lessonFileParam") {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.userId) {
        response.error(res, "Unauthorized", 401);
        return;
      }

      let moduleId: number;

      if (source === "body") {
        moduleId = Number(req.body.module_id);
        if (!moduleId || Number.isNaN(moduleId)) {
          response.error(res, "module_id is required", 400);
          return;
        }
      } else {
        const fileId = Number(req.params.id);
        if (!fileId || Number.isNaN(fileId)) {
          response.error(res, "Invalid file ID", 400);
          return;
        }
        const lessonFile = await prisma.lesson_files.findUnique({
          where: { id: fileId },
          select: { module_id: true },
        });
        if (!lessonFile) {
          response.error(res, "Lesson file not found", 404);
          return;
        }
        moduleId = lessonFile.module_id;
      }

      const module = await prisma.modules.findUnique({
        where: { id: moduleId },
        select: { semesters: { select: { level_id: true } } },
      });

      if (!module) {
        response.error(res, "Module not found", 404);
        return;
      }

      const levelId = module.semesters.level_id;

      const roles = req.user.roles ?? [];

      if (roles.includes("Super Admin")) {
        next();
        return;
      }

      if (roles.includes("Admin")) {
        const adminLevel = await prisma.admin_levels.findUnique({
          where: {
            user_id_level_id: {
              user_id: req.user.userId,
              level_id: levelId,
            },
          },
        });

        if (adminLevel) {
          next();
          return;
        }
      }

      response.error(res, "Forbidden: you do not have access to this level", 403);
    } catch (err) {
      console.error("requireLevelAccess error:", err);
      response.error(res, "Authorization check failed", 500);
    }
  };
}
