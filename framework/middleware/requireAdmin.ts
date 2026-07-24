import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import { response } from "../utils/response.js";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.userId) {
      response.error(res, "Unauthorized", 401);
      return;
    }

    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: req.user.userId },
      include: { roles: true },
    });

    const isAdmin = userRoles.some((ur) => ur.roles.name === "Admin");

    if (!isAdmin) {
      response.error(res, "Forbidden: Admin access required", 403);
      return;
    }

    next();
  } catch {
    response.error(res, "Authorization check failed", 500);
  }
};
