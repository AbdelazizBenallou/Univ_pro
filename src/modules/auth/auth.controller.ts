import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { response } from "../../../framework/utils/response.js";
import { env } from "../../../framework/config/env.js";
import { asyncHandler } from "../../../framework/middleware/asyncHandler.js";
import { refreshTokenRepository } from "./refresh-token.repository.js";
import { jwtUtils } from "../../../framework/utils/jwt.js";
import { hash } from "../../../framework/utils/hash.js";

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password, device_fingerprint } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    const data = await authService.login({ email, password, device_fingerprint }, ip, userAgent);

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.success(res, data, "Login successful");
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.refreshPayload!.userId;
    const newAccessToken = await authService.refreshAccessToken(userId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    response.success(res, { accessToken: newAccessToken }, "Token refreshed");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};

    if (refreshToken) {
      let payload: { userId: number };
      try {
        payload = jwtUtils.verifyRefreshToken(refreshToken);
      } catch {
        response.error(res, "Invalid refresh token", 403);
        return;
      }

      const storedTokens = await refreshTokenRepository.findValidByUserId(payload.userId);

      for (const t of storedTokens) {
        const match = await hash.verifyToken(t.token, refreshToken).catch(() => false);
        if (match) {
          await refreshTokenRepository.revokeById(t.id);
          break;
        }
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    response.success(res, null, "Logged out successfully");
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    if (result.alreadyExists) {
      res.status(409).json({
        success: false,
        message: "Email already registered",
        status: result.status,
      });
      return;
    }

    response.success(res, { email: req.body.email?.toLowerCase() }, "Verification code sent to your email", 201);
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifyEmail(req.body);
    response.success(res, null, "Email verified successfully");
  }),

  resendCode: asyncHandler(async (req: Request, res: Response) => {
    await authService.resendCode(req.body);
    response.success(res, null, "Verification code resent to your email");
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    response.success(res, null, "Password reset code sent to your email");
  }),

  verifyResetCode: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.verifyResetCode(req.body);
    response.success(res, data, "Code verified successfully");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    response.success(res, null, "Password reset successfully");
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await authService.changePassword(userId, req.body);
    response.success(res, null, "Password changed successfully. Please login again.");
  }),
};
