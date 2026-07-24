import prisma from "../../../framework/config/prisma.js";

export const seasonService = {
  async findAll() {
    return prisma.seasons.findMany({
      select: { id: true, name: true, is_current: true },
      orderBy: { id: "asc" },
    });
  },
};
