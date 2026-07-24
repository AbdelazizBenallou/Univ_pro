import prisma from "../../../framework/config/prisma.js";
import { AppError } from "../../../framework/utils/AppError.js";

export const moduleService = {
  async findBySemester(semesterId: number, specialityId?: number) {
    const where: Record<string, unknown> = { semester_id: semesterId };

    if (specialityId !== undefined) {
      where.speciality_id = specialityId;
    } else {
      where.speciality_id = null;
    }

    return prisma.modules.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        coefficient: true,
        credit: true,
        semesters: { select: { id: true, name: true } },
      },
      orderBy: { id: "asc" },
    });
  },

  async findComponentsByModuleId(moduleId: number) {
    const module = await prisma.modules.findUnique({
      where: { id: moduleId },
      select: { id: true, name: true },
    });

    if (!module) {
      throw new AppError("Module not found", 404);
    }

    const components = await prisma.module_components.findMany({
      where: { module_id: moduleId },
      select: {
        activity_types: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      module_id: moduleId,
      module_name: module.name,
      components: components.map((c) => c.activity_types),
    };
  },
};
