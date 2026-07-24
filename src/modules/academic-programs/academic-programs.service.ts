import prisma from "../../../framework/config/prisma.js";

export const academicProgramService = {
  async findAll() {
    return prisma.academic_programs.findMany({
      select: {
        id: true,
        name: true,
        levels: {
          select: { id: true, name: true },
          orderBy: { id: "asc" },
        },
        specialities: {
          select: { id: true, name: true, code: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });
  },
};
