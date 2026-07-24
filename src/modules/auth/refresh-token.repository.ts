import { Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";

export const refreshTokenRepository = {
  async create(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.refresh_tokens.create({
      data: {
        user_id: userId,
        token: tokenHash,
        expires_at: expiresAt,
      },
    });
  },

  async findValidByUserId(userId: number): Promise<{ id: number; token: string }[]> {
    return prisma.refresh_tokens.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      select: { id: true, token: true },
    });
  },

  async revokeById(id: number): Promise<void> {
    await prisma.refresh_tokens.delete({
      where: { id },
    });
  },
};
