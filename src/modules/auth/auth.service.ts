import crypto from "node:crypto";
import prisma from "../../../framework/config/prisma.js";
import { hash } from "../../../framework/utils/hash.js";
import { jwtUtils, type AccessTokenPayload } from "../../../framework/utils/jwt.js";
import { AppError } from "../../../framework/utils/AppError.js";
import { emailUtils } from "../../../framework/utils/email.js";
import type { LoginInput, RegisterInput, VerifyEmailInput, ResendCodeInput, ForgotPasswordInput, VerifyResetCodeInput, ResetPasswordInput, ChangePasswordInput } from "./auth.validator.js";

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;
const CODE_EXPIRY_MINUTES = 5;
const RESET_TOKEN_EXPIRY_MINUTES = 10;
const MAX_CODES_PER_DAY = 3;

function computeRefreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
}

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function computeCodeExpiry(): Date {
  return new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
}

export const authService = {
  async login(data: LoginInput, ip: string, userAgent: string) {
    const email = data.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        profiles: {
          select: {
            first_name: true,
            last_name: true,
            student_id: true,
            phone: true,
            gender: true,
            level_id: true,
            speciality_id: true,
            levels: { select: { id: true, name: true } },
            specialities: { select: { id: true, name: true, code: true } },
          },
        },
        user_roles: { include: { roles: { select: { name: true } } } },
      },
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (user.status !== "active") {
      await prisma.login_history.create({
        data: { user_id: user.id, ip_address: ip, user_agent: userAgent, success: false },
      });
      throw new AppError("Account is not active", 401);
    }

    const device = await prisma.devices.findFirst({
      where: {
        device_fingerprint: data.device_fingerprint,
        user_id: user.id,
      },
    });

    if (!device) {
      await prisma.login_history.create({
        data: { user_id: user.id, ip_address: ip, user_agent: userAgent, success: false },
      });
      throw new AppError("Device not recognized", 403);
    }

    const isValid = await hash.verify(user.password, data.password);
    if (!isValid) {
      await prisma.login_history.create({
        data: { user_id: user.id, ip_address: ip, user_agent: userAgent, success: false },
      });
      throw new AppError("Invalid credentials", 401);
    }

    const roles = user.user_roles.map((ur) => ur.roles.name);

    const tokenPayload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    const accessToken = jwtUtils.signAccessToken(tokenPayload);
    const refreshToken = jwtUtils.signRefreshToken({ userId: user.id, email: user.email });
    const tokenHash = await hash.token(refreshToken);

    await prisma.$transaction(async (tx) => {
      await tx.refresh_tokens.create({
        data: {
          user_id: user.id,
          token: tokenHash,
          expires_at: computeRefreshExpiry(),
        },
      });

      await tx.login_history.create({
        data: {
          user_id: user.id,
          ip_address: ip,
          user_agent: userAgent,
          success: true,
        },
      });

      await tx.devices.update({
        where: { id: device.id },
        data: { last_active: new Date() },
      });
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        roles,
        profile: {
          first_name: user.profiles?.first_name,
          last_name: user.profiles?.last_name,
          student_id: user.profiles?.student_id,
          phone: user.profiles?.phone,
          gender: user.profiles?.gender,
          level: user.profiles?.levels ?? null,
          speciality: user.profiles?.specialities ?? null,
        },
      },
    };
  },

  async refreshAccessToken(userId: number) {
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", 403);
    }

    const userRoles = await prisma.user_roles.findMany({
      where: { user_id: userId },
      include: { roles: { select: { name: true } } },
    });

    const roles = userRoles.map((ur) => ur.roles.name);

    return jwtUtils.signAccessToken({
      userId: user.id,
      email: user.email,
      roles,
    });
  },

  async register(data: RegisterInput) {
    const email = data.email.toLowerCase();

    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (existingUser) {
      return {
        alreadyExists: true,
        status: existingUser.status,
      };
    }

    const existingDevice = await prisma.devices.findUnique({
      where: { device_fingerprint: data.device_fingerprint },
      select: { id: true },
    });

    if (existingDevice) {
      throw new AppError("Device fingerprint already registered to another account", 409);
    }

    const deviceTrialUser = await prisma.devices.findFirst({
      where: {
        device_fingerprint: data.device_fingerprint,
        users: {
          subscriptions: {
            some: { type: "free_trial" },
          },
        },
      },
      select: { id: true },
    });

    if (deviceTrialUser) {
      throw new AppError("This device has already been used for a free trial", 409);
    }

    const passwordHash = await hash.password(data.password);
    const code = generateCode();

    const studentRole = await prisma.roles.findUnique({
      where: { name: "Student" },
      select: { id: true },
    });

    if (!studentRole) {
      throw new AppError("Student role not found", 500);
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password: passwordHash,
          status: "pending",
        },
      });

      await tx.profiles.create({
        data: {
          user_id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone ?? null,
          gender: data.gender,
          level_id: data.level_id,
          speciality_id: data.speciality_id ?? null,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: studentRole.id,
        },
      });

      await tx.devices.create({
        data: {
          user_id: user.id,
          device_fingerprint: data.device_fingerprint,
          device_name: data.device_name,
          last_active: new Date(),
        },
      });

      await tx.email_verifications.create({
        data: {
          user_id: user.id,
          code,
          expires_at: computeCodeExpiry(),
          type: "email_verify",
        },
      });
    });

    await emailUtils.sendVerificationCode(email, code);

    return { alreadyExists: false };
  },

  async verifyEmail(data: VerifyEmailInput) {
    const email = data.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "pending") {
      throw new AppError("Email already verified", 400);
    }

    const verification = await prisma.email_verifications.findFirst({
      where: {
        user_id: user.id,
        code: data.code,
        type: "email_verify",
        used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new AppError("Invalid or expired code", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.email_verifications.update({
        where: { id: verification.id },
        data: { used: true },
      });

      await tx.users.update({
        where: { id: user.id },
        data: { status: "active" },
      });

      const profile = await tx.profiles.findUnique({
        where: { user_id: user.id },
        select: { level_id: true, speciality_id: true },
      });

      if (profile?.level_id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentSemester = await tx.semesters.findFirst({
          where: {
            level_id: profile.level_id,
            start_date: { lte: today },
            end_date: { gte: today },
          },
          select: { id: true, end_date: true },
        });

        if (currentSemester) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);

          await tx.subscriptions.create({
            data: {
              user_id: user.id,
              semester_id: currentSemester.id,
              type: "free_trial",
              start_date: today,
              end_date: trialEnd,
              status: "active",
              speciality_id: profile.speciality_id ?? null,
            },
          });
        }
      }
    });
  },

  async resendCode(data: ResendCodeInput) {
    const email = data.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "pending") {
      throw new AppError("Email already verified", 400);
    }

    // TODO: re-enable rate limit before production
    // const todayStart = new Date();
    // todayStart.setHours(0, 0, 0, 0);
    // const codesSentToday = await prisma.email_verifications.count({
    //   where: { user_id: user.id, type: "email_verify", created_at: { gte: todayStart } },
    // });
    // if (codesSentToday >= MAX_CODES_PER_DAY) {
    //   throw new AppError("Maximum 3 verification codes per day. Try again tomorrow.", 429);
    // }

    await prisma.email_verifications.updateMany({
      where: {
        user_id: user.id,
        type: "email_verify",
        used: false,
      },
      data: { used: true },
    });

    const code = generateCode();

    await prisma.email_verifications.create({
      data: {
        user_id: user.id,
        code,
        expires_at: computeCodeExpiry(),
        type: "email_verify",
      },
    });

    await emailUtils.sendVerificationCode(email, code);
  },

  async forgotPassword(data: ForgotPasswordInput) {
    const email = data.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", 400);
    }

    // TODO: re-enable rate limit before production
    // const todayStart = new Date();
    // todayStart.setHours(0, 0, 0, 0);
    // const codesSentToday = await prisma.email_verifications.count({
    //   where: { user_id: user.id, type: "password_reset", created_at: { gte: todayStart } },
    // });
    // if (codesSentToday >= MAX_CODES_PER_DAY) {
    //   throw new AppError("Maximum 3 codes per day. Try again tomorrow.", 429);
    // }

    await prisma.email_verifications.updateMany({
      where: {
        user_id: user.id,
        type: "password_reset",
        used: false,
      },
      data: { used: true },
    });

    const code = generateCode();

    await prisma.email_verifications.create({
      data: {
        user_id: user.id,
        code,
        expires_at: computeCodeExpiry(),
        type: "password_reset",
      },
    });

    await emailUtils.sendVerificationCode(email, code);
  },

  async verifyResetCode(data: VerifyResetCodeInput) {
    const email = data.email.toLowerCase();

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", 400);
    }

    const verification = await prisma.email_verifications.findFirst({
      where: {
        user_id: user.id,
        code: data.code,
        type: "password_reset",
        used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new AppError("Invalid or expired code", 400);
    }

    await prisma.email_verifications.update({
      where: { id: verification.id },
      data: { used: true },
    });

    const resetToken = jwtUtils.signAccessToken({
      userId: user.id,
      email: user.email,
      roles: ["password_reset"],
    });

    return { resetToken };
  },

  async resetPassword(data: ResetPasswordInput) {
    let decoded: { userId: number; email: string; roles: string[] };
    try {
      decoded = jwtUtils.verifyAccessToken(data.token);
    } catch {
      throw new AppError("Invalid or expired reset token", 400);
    }

    if (!decoded.roles.includes("password_reset")) {
      throw new AppError("Invalid reset token", 400);
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "active") {
      throw new AppError("Account is not active", 400);
    }

    const passwordHash = await hash.password(data.password);

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: { password: passwordHash },
      });

      await tx.refresh_tokens.deleteMany({
        where: { user_id: user.id },
      });
    });
  },

  async changePassword(userId: number, data: ChangePasswordInput) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isValid = await hash.verify(user.password, data.oldPassword);
    if (!isValid) {
      throw new AppError("Invalid current password", 401);
    }

    const passwordHash = await hash.password(data.newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: { password: passwordHash },
      });

      await tx.refresh_tokens.deleteMany({
        where: { user_id: userId },
      });
    });
  },
};
