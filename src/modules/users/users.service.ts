import { AppError } from "../../../framework/utils/AppError.js";
import { userRepository } from "./user.repository.js";
import type { ListUsersInput, UpdateUserInput, UpdateProfileInput } from "./users.validator.js";

async function getAll(input: ListUsersInput) {
  if (input.page) {
    const perPage = input.perPage ?? 100;
    const offset = (input.page - 1) * perPage;

    const { data, total } = await userRepository.findManyWithOffset(offset, perPage);

    return {
      data,
      total,
      page: input.page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  const limit = input.limit ?? 100;
  const result = await userRepository.findManyWithCursor(input.cursor, limit);

  return result;
}

async function getById(id: number) {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

async function update(id: number, data: UpdateUserInput) {
  const exists = await userRepository.exists(id);

  if (!exists) {
    throw new AppError("User not found", 404);
  }

  return userRepository.update(id, data);
}

async function remove(id: number) {
  const exists = await userRepository.exists(id);

  if (!exists) {
    throw new AppError("User not found", 404);
  }

  await userRepository.delete(id);
}

async function getMyProfile(userId: number) {
  const profile = await userRepository.findProfileByUserId(userId);

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  return profile;
}

async function updateMyProfile(userId: number, data: UpdateProfileInput) {
  if (data.phone_provider_id !== undefined && data.phone_provider_id !== null) {
    const providerExists = await userRepository.phoneProviderExists(data.phone_provider_id);
    if (!providerExists) {
      throw new AppError("Phone provider not found", 404);
    }
  }

  const profile = await userRepository.findProfileByUserId(userId);

  if (!profile) {
    throw new AppError("Profile not found", 404);
  }

  return userRepository.updateProfile(userId, data);
}

export const usersService = { getAll, getById, update, remove, getMyProfile, updateMyProfile };
