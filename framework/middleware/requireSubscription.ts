import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { response } from "../utils/response.js";

export type SubSource = "query" | "lessonFileParam";

export function requireSubscription(source: SubSource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user?.userId) {
        response.error(res, "Unauthorized", 401);
        return;
      }

      const roles = user.roles ?? [];
      if (roles.includes("Super Admin") || roles.includes("Admin")) {
        next();
        return;
      }

      let semesterId: number;

      if (source === "query") {
        const raw = Number(req.query.module_id);
        if (!raw || Number.isNaN(raw)) {
          response.error(res, "module_id query param is required", 400);
          return;
        }
        const module = await prisma.modules.findUnique({
          where: { id: raw },
          select: { semester_id: true },
        });
        if (!module) {
          response.error(res, "Module not found", 404);
          return;
        }
        semesterId = module.semester_id;
      } else {
        const fileId = Number(req.params.id);
        if (!fileId || Number.isNaN(fileId)) {
          response.error(res, "Invalid file ID", 400);
          return;
        }
        const lessonFile = await prisma.lesson_files.findUnique({
          where: { id: fileId },
          select: { modules: { select: { semester_id: true } } },
        });
        if (!lessonFile) {
          response.error(res, "Lesson file not found", 404);
          return;
        }
        semesterId = lessonFile.modules.semester_id;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeSub = await prisma.subscriptions.findFirst({
        where: {
          user_id: user.userId,
          semester_id: semesterId,
          status: "active",
          end_date: { gte: today },
        },
        select: { id: true },
      });

      if (!activeSub) {
        response.error(res, "No active subscription for this semester", 403);
        return;
      }

      next();
    } catch (err) {
      console.error("requireSubscription error:", err);
      response.error(res, "Subscription check failed", 500);
    }
  };
}
