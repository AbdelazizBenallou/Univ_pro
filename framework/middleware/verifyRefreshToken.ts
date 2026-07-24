import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { jwtUtils } from "../utils/jwt.js";
import { hash } from "../utils/hash.js";
import { response } from "../utils/response.js";
import prisma from "../config/prisma.js";

export const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    response.error(res, "Refresh token is required", 400);
    return;
  }

  let decoded: { userId: number; email: string };
  try {
    decoded = jwtUtils.verifyRefreshToken(refreshToken);
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      response.error(res, "Refresh token expired", 403);
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      response.error(res, "Invalid refresh token", 403);
      return;
    }
    response.error(res, "Invalid refresh token", 403);
    return;
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
    select: { id: true, status: true },
  });

  if (!user) {
    response.error(res, "User not found", 401);
    return;
  }

  if (user.status !== "active") {
    response.error(res, "Account is not active", 403);
    return;
  }

  const storedTokens = await prisma.refresh_tokens.findMany({
    where: {
      user_id: decoded.userId,
      expires_at: { gt: new Date() },
    },
    select: { id: true, token: true },
  });

  const match = await findTokenMatch(storedTokens, refreshToken);

  if (!match) {
    response.error(res, "Invalid refresh token", 403);
    return;
  }

  req.refreshPayload = decoded;
  next();
};

async function findTokenMatch(
  tokens: { id: number; token: string }[],
  rawToken: string
): Promise<{ id: number } | null> {
  for (const t of tokens) {
    const isValid = await hash.verifyToken(t.token, rawToken).catch(() => false);
    if (isValid) return t;
  }
  return null;
}
