import { Prisma } from "@prisma/client";
import type { UserStatus } from "@prisma/client";
import prisma from "../../../framework/config/prisma.js";
import type { UpdateProfileInput } from "./users.validator.js";

type UserInclude = {
  profile: { include: { avatar: true } };
  user_role: { include: { role: true } };
};

const userInclude: UserInclude = {
  profile: { include: { avatar: true } },
  user_role: {
    include: { role: true },
  },
};

type UserWithRelations = Prisma.UserGetPayload<{ include: UserInclude }>;

export interface AuthUserResult {
  user_id: number;
  email: string;
  password_hash: string;
  status: string;
  profile: { first_name: string | null; last_name: string | null } | null;
  roles: string[];
}

export interface UserResponse {
  user_id: number;
  email: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  profile: {
    first_name: string | null;
    last_name: string | null;
    date_birth: Date | null;
    address: string | null;
    avatar_file_id: number | null;
    avatar_url: string | null;
    level_id: number | null;
    specialization_id: number | null;
  } | null;
  roles: string[];
}

function toResponse(user: UserWithRelations): UserResponse {
  return {
    user_id: user.user_id,
    email: user.email,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
    profile: user.profile
      ? {
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        date_birth: user.profile.date_birth,
        address: user.profile.address,
        avatar_file_id: user.profile.avatar_file_id,
        avatar_url: user.profile.avatar
          ? `/v1/files/${user.profile.avatar.file_id}/download?disposition=inline`
          : null,
        level_id: user.profile.level_id,
        specialization_id: user.profile.specialization_id,
      }
      : null,
    roles: user.user_role.map((r) => r.role.name),
  };
}

export const userRepository = {
  async findById(id: number): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { user_id: id },
      include: userInclude,
    });

    return user ? toResponse(user) : null;
  },

  async findByEmail(email: string): Promise<{ user_id: number } | null> {
    return prisma.user.findUnique({
      where: { email },
      select: { user_id: true },
    });
  },

  async findAuthByEmail(email: string): Promise<AuthUserResult | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: { select: { first_name: true, last_name: true } },
        user_role: { include: { role: { select: { name: true } } } },
      },
    });

    if (!user) return null;

    return {
      user_id: user.user_id,
      email: user.email,
      password_hash: user.password_hash,
      status: user.status,
      profile: user.profile
        ? { first_name: user.profile.first_name, last_name: user.profile.last_name }
        : null,
      roles: user.user_role.map((r) => r.role.name),
    };
  },

  async findManyWithCursor(cursor: number | undefined, limit: number) {
    const users = await prisma.user.findMany({
      take: limit + 1,
      cursor: cursor ? { user_id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: userInclude,
      orderBy: { user_id: "asc" },
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;

    return {
      data: data.map(toResponse),
      nextCursor: hasMore ? data[data.length - 1].user_id : null,
      hasMore,
    };
  },

  async findManyWithOffset(skip: number, take: number) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        take,
        skip,
        include: userInclude,
        orderBy: { user_id: "asc" },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users.map(toResponse),
      total,
    };
  },

  async exists(id: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { user_id: id },
      select: { user_id: true },
    });
    return user !== null;
  },

  async update(
    id: number,
    data: { status?: string; first_name?: string; last_name?: string; avatar_file_id?: number | null }
  ): Promise<UserResponse> {
    const user = await prisma.user.update({
      where: { user_id: id },
      data: {
        ...(data.status && { status: data.status as UserStatus }),
        ...((data.first_name || data.last_name || data.avatar_file_id !== undefined) && {
          profile: {
            upsert: {
              create: {
                first_name: data.first_name ?? null,
                last_name: data.last_name ?? null,
                ...(data.avatar_file_id !== undefined && { avatar_file_id: data.avatar_file_id }),
              },
              update: {
                ...(data.first_name && { first_name: data.first_name }),
                ...(data.last_name && { last_name: data.last_name }),
                ...(data.avatar_file_id !== undefined && { avatar_file_id: data.avatar_file_id }),
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
    await prisma.user.delete({ where: { user_id: id } });
  },

  // Profile methods
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
