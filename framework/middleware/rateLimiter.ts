import type { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimit = (limiter: RateLimiterMemory) =>
  (req: Request, res: Response, next: NextFunction): void => {
    limiter.consume(req.ip ?? "unknown")
      .then(() => next())
      .catch(() => {
        res.status(429).json({
          success: false,
          message: "Too many requests, please try again later",
        });
      });
  };

const rateLimitByKey = (limiter: RateLimiterMemory, keyFn: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    limiter.consume(keyFn(req))
      .then(() => next())
      .catch(() => {
        res.status(429).json({
          success: false,
          message: "Too many requests, please try again later",
        });
      });
  };

// Auth
export const loginRateLimit = rateLimit(new RateLimiterMemory({ points: 10, duration: 60 }));
export const loginEmailRateLimit = rateLimit(new RateLimiterMemory({ points: 5, duration: 300 }));
export const registerRateLimit = rateLimit(new RateLimiterMemory({ points: 3, duration: 3600 }));
export const verifyEmailRateLimit = rateLimit(new RateLimiterMemory({ points: 10, duration: 300 }));
export const verifyEmailEmailRateLimit = rateLimitByKey(
  new RateLimiterMemory({ points: 10, duration: 300 }),
  (req) => `verify:${req.body.email}`
);
export const resendCodeRateLimit = rateLimit(new RateLimiterMemory({ points: 5, duration: 300 }));
export const forgotPasswordRateLimit = rateLimit(new RateLimiterMemory({ points: 5, duration: 300 }));
export const resetPasswordRateLimit = rateLimit(new RateLimiterMemory({ points: 5, duration: 300 }));
export const changePasswordRateLimit = rateLimit(new RateLimiterMemory({ points: 5, duration: 300 }));
export const refreshTokenRateLimit = rateLimit(new RateLimiterMemory({ points: 20, duration: 60 }));
export const logoutRateLimit = rateLimit(new RateLimiterMemory({ points: 20, duration: 60 }));

// General / global
export const generalRateLimit = rateLimit(new RateLimiterMemory({ points: 100, duration: 60 }));
export const globalRateLimit = rateLimit(new RateLimiterMemory({ points: 1000, duration: 60 }));

// File upload
export const uploadRateLimit = rateLimit(new RateLimiterMemory({ points: 10, duration: 60 }));

// Users
export const listUsersRateLimit = rateLimit(new RateLimiterMemory({ points: 30, duration: 60 }));
export const getUserRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));
export const updateUserRateLimit = rateLimit(new RateLimiterMemory({ points: 20, duration: 60 }));
export const deleteUserRateLimit = rateLimit(new RateLimiterMemory({ points: 10, duration: 60 }));

// Profile
export const getMyProfileRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));
export const updateMyProfileRateLimit = rateLimit(new RateLimiterMemory({ points: 20, duration: 60 }));

// Roles & Permissions
export const roleRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));
export const permissionRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));

// Lesson files
export const lessonFileUploadRateLimit = rateLimit(new RateLimiterMemory({ points: 30, duration: 60 }));
export const lessonFileDownloadRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));
export const lessonFileDeleteRateLimit = rateLimit(new RateLimiterMemory({ points: 10, duration: 60 }));

// Reviews
export const createReviewRateLimit = rateLimitByKey(
  new RateLimiterMemory({ points: 3, duration: 3600 }),
  (req) => `review:create:${req.user?.userId ?? "anon"}`
);
export const listReviewsRateLimit = rateLimit(new RateLimiterMemory({ points: 60, duration: 60 }));
