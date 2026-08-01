import prisma from "../../../framework/config/prisma.js";

const reviewSelect = {
  id: true,
  comment: true,
  created_at: true,
  updated_at: true,
  users: {
    select: {
      id: true,
      profiles: {
        select: {
          first_name: true,
          last_name: true,
          avatar: true,
        },
      },
    },
  },
} as const;

export const reviewRepository = {
  async create(userId: number, comment: string) {
    return prisma.reviews.create({
      data: { user_id: userId, comment },
      select: reviewSelect,
    });
  },

  async findLatestByUserId(userId: number) {
    return prisma.reviews.findFirst({
      where: { user_id: userId },
      select: reviewSelect,
      orderBy: { created_at: "desc" },
    });
  },

  async findManyWithOffset(skip: number, take: number) {
    const [data, total] = await Promise.all([
      prisma.reviews.findMany({
        skip,
        take,
        select: reviewSelect,
        orderBy: { created_at: "desc" },
      }),
      prisma.reviews.count(),
    ]);

    return { data, total };
  },
};
