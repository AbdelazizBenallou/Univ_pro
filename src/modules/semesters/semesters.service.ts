import prisma from "../../../framework/config/prisma.js";

export const semesterService = {
  async findByLevelId(levelId: number) {
    return prisma.semesters.findMany({
      where: { level_id: levelId },
      select: { id: true, name: true, level_id: true, is_current: true, start_date: true, end_date: true },
      orderBy: { id: "asc" },
    });
  },
};
