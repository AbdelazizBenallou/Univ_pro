import prisma from "../../../framework/config/prisma.js";
import { AppError } from "../../../framework/utils/AppError.js";

export const subscriptionsService = {
  async listDemands(userId: number, roles: string[], query: { status?: string; page: number; perPage: number }) {
    const where: any = {};

    if (!roles.includes("Super Admin") && !roles.includes("Admin")) {
      where.user_id = userId;
    } else if (query.status) {
      where.status = query.status;
    }

    const skip = (query.page - 1) * query.perPage;

    const [data, total] = await Promise.all([
      prisma.subscription_demands.findMany({
        where,
        include: {
          semesters: { select: { id: true, name: true } },
          specialities: { select: { id: true, name: true, code: true } },
          users_subscription_demands_admin_idTousers: { select: { id: true, email: true } },
        },
        skip,
        take: query.perPage,
        orderBy: { requested_at: "desc" },
      }),
      prisma.subscription_demands.count({ where }),
    ]);

    return {
      data: data.map((d) => ({
        id: d.id,
        user_id: d.user_id,
        semester: d.semesters,
        type: d.type,
        status: d.status,
        speciality: d.specialities ?? null,
        admin: d.users_subscription_demands_admin_idTousers ?? null,
        admin_note: d.admin_note,
        requested_at: d.requested_at,
        processed_at: d.processed_at,
      })),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  },

  async createDemand(userId: number, data: { semester_id: number; type?: string; speciality_id?: number }) {
    const semester = await prisma.semesters.findUnique({
      where: { id: data.semester_id },
      select: { id: true, is_current: true, start_date: true, end_date: true },
    });

    if (!semester) throw new AppError("Semester not found", 404);
    if (!semester.is_current) throw new AppError("You can only subscribe to the current semester", 400);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (semester.end_date < today) {
      throw new AppError("This semester has already ended", 400);
    }

    const existingDemand = await prisma.subscription_demands.findFirst({
      where: {
        user_id: userId,
        semester_id: data.semester_id,
        status: "pending",
      },
      select: { id: true },
    });

    if (existingDemand) {
      throw new AppError("You already have a pending demand for this semester", 409);
    }

    const demand = await prisma.subscription_demands.create({
      data: {
        user_id: userId,
        semester_id: data.semester_id,
        type: data.type ?? "premium",
        status: "pending",
        speciality_id: data.speciality_id ?? null,
      },
      select: { id: true, status: true, requested_at: true, semester_id: true },
    });

    return demand;
  },

  async processDemand(demandId: number, adminId: number, data: { status: string; admin_note?: string }) {
    const demand = await prisma.subscription_demands.findUnique({
      where: { id: demandId },
      select: {
        id: true,
        status: true,
        user_id: true,
        semester_id: true,
        speciality_id: true,
        type: true,
      },
    });

    if (!demand) throw new AppError("Demand not found", 404);

    if (demand.status !== "pending") {
      throw new AppError("Demand has already been processed", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const semester = await prisma.semesters.findUnique({
      where: { id: demand.semester_id },
      select: { end_date: true },
    });

    if (!semester) throw new AppError("Semester not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.subscription_demands.update({
        where: { id: demandId },
        data: {
          status: data.status,
          admin_id: adminId,
          admin_note: data.admin_note ?? null,
          processed_at: new Date(),
        },
      });

      if (data.status === "approved") {
        await tx.subscriptions.create({
          data: {
            user_id: demand.user_id,
            semester_id: demand.semester_id,
            type: demand.type,
            start_date: today,
            end_date: semester.end_date,
            status: "active",
            speciality_id: demand.speciality_id ?? null,
          },
        });
      }
    });

    return { id: demandId, status: data.status };
  },

  async listSubscriptions(userId: number, roles: string[], query: { page: number; perPage: number }) {
    const where: any = {};

    if (!roles.includes("Super Admin") && !roles.includes("Admin")) {
      where.user_id = userId;
    }

    const skip = (query.page - 1) * query.perPage;

    const [data, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          semesters: { select: { id: true, name: true } },
          specialities: { select: { id: true, name: true, code: true } },
        },
        skip,
        take: query.perPage,
        orderBy: { start_date: "desc" },
      }),
      prisma.subscriptions.count({ where }),
    ]);

    return {
      data: data.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        semester: s.semesters,
        type: s.type,
        status: s.status,
        speciality: s.specialities ?? null,
        start_date: s.start_date,
        end_date: s.end_date,
        created_at: s.created_at,
      })),
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
        totalPages: Math.ceil(total / query.perPage),
      },
    };
  },

  async getCurrentSubscription(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sub = await prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
        status: "active",
        end_date: { gte: today },
      },
      include: {
        semesters: { select: { id: true, name: true, start_date: true, end_date: true } },
        specialities: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ type: "desc" }, { end_date: "asc" }],
    });

    if (!sub) return null;

    const remainingDays = Math.ceil((sub.end_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: sub.id,
      user_id: sub.user_id,
      semester: sub.semesters,
      type: sub.type,
      status: sub.status,
      speciality: sub.specialities ?? null,
      start_date: sub.start_date,
      end_date: sub.end_date,
      remaining_days: remainingDays,
    };
  },
};
