import { Prisma } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";
import type { UpdateProfileInput } from "./users.validator.js";

const userInclude = {
  profiles: { select: { first_name: true, last_name: true, date_of_birth: true, address: true, avatar: true, level_id: true, speciality_id: true } },
  user_roles: { include: { roles: true } },
};

type UserWithRelations = Prisma.usersGetPayload<{ include: typeof userInclude }>;

export interface AuthUserResult {
  id: number;
  email: string;
  password: string;
  status: string;
  profile: { first_name: string | null; last_name: string | null } | null;
  roles: string[];
}

export interface UserResponse {
  id: number;
  email: string;
  status: string;
  created_at: Date | null;
  updated_at: Date | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    date_of_birth: Date | null;
    address: string | null;
    avatar: string | null;
    level_id: number | null;
    speciality_id: number | null;
  } | null;
  roles: string[];
}

function toResponse(user: UserWithRelations): UserResponse {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    profile: user.profiles
      ? {
        first_name: user.profiles.first_name,
        last_name: user.profiles.last_name,
        date_of_birth: user.profiles.date_of_birth,
        address: user.profiles.address,
        avatar: user.profiles.avatar,
        level_id: user.profiles.level_id,
        speciality_id: user.profiles.speciality_id,
      }
      : null,
    roles: user.user_roles.map((r) => r.roles.name),
  };
}

export const userRepository = {
  async findById(id: number): Promise<UserResponse | null> {
    const user = await prisma.users.findUnique({
      where: { id },
      include: userInclude,
    });

    return user ? toResponse(user) : null;
  },

  async findByEmail(email: string): Promise<{ id: number } | null> {
    return prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async findAuthByEmail(email: string): Promise<AuthUserResult | null> {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        profiles: { select: { first_name: true, last_name: true, date_of_birth: true, address: true, avatar: true, level_id: true, speciality_id: true } },
        user_roles: { include: { roles: { select: { name: true } } } },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      status: user.status,
      profile: user.profiles
        ? { first_name: user.profiles.first_name, last_name: user.profiles.last_name }
        : null,
      roles: user.user_roles.map((r) => r.roles.name),
    };
  },

  async findManyWithCursor(cursor: number | undefined, limit: number) {
    const users = await prisma.users.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: userInclude,
      orderBy: { id: "asc" },
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;

    return {
      data: data.map(toResponse),
      nextCursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  },

  async findManyWithOffset(skip: number, take: number) {
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        take,
        skip,
        include: userInclude,
        orderBy: { id: "asc" },
      }),
      prisma.users.count(),
    ]);

    return {
      data: users.map(toResponse),
      total,
    };
  },

  async exists(id: number): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });
    return user !== null;
  },

  async update(
    id: number,
    data: { status?: string; first_name?: string; last_name?: string; avatar?: string | null }
  ): Promise<UserResponse> {
    const user = await prisma.users.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...((data.first_name || data.last_name || data.avatar !== undefined) && {
          profiles: {
            upsert: {
              create: {
                first_name: data.first_name ?? "",
                last_name: data.last_name ?? "",
                ...(data.avatar !== undefined && { avatar: data.avatar }),
              },
              update: {
                ...(data.first_name && { first_name: data.first_name }),
                ...(data.last_name && { last_name: data.last_name }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
              },
            },
          },
        }),
      },
      include: userInclude,
    });

    return toResponse(user);
  },

  async delete(id: number): Promise<void> {
    await prisma.users.delete({ where: { id } });
  },

  async findProfileByUserId(userId: number) {
    return prisma.profiles.findUnique({
      where: { user_id: userId },
      include: {
        levels: { select: { id: true, name: true } },
        specialities: { select: { id: true, name: true, code: true } },
        phone_providers: { select: { id: true, name: true, code: true } },
        social_media_links: { select: { platform: true, url: true } },
      },
    });
  },

  async phoneProviderExists(id: number): Promise<boolean> {
    const provider = await prisma.phone_providers.findUnique({
      where: { id },
      select: { id: true },
    });
    return provider !== null;
  },

  async updateProfile(userId: number, data: UpdateProfileInput) {
    const updateData: Record<string, unknown> = {};

    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.phone_provider_id !== undefined) updateData.phone_provider_id = data.phone_provider_id;
    if (data.date_of_birth !== undefined)
      updateData.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    return prisma.profiles.update({
      where: { user_id: userId },
      data: updateData,
      include: {
        levels: { select: { id: true, name: true } },
        specialities: { select: { id: true, name: true, code: true } },
        phone_providers: { select: { id: true, name: true, code: true } },
        social_media_links: { select: { platform: true, url: true } },
      },
    });
  },
};
