import { AppError } from "../../../framework/utils/AppError.js";
import { reviewRepository } from "./reviews.repository.js";

async function create(userId: number, comment: string) {
  return reviewRepository.create(userId, comment);
}

async function getMy(userId: number) {
  const review = await reviewRepository.findLatestByUserId(userId);

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  return review;
}

async function list(page: number, perPage: number) {
  const offset = (page - 1) * perPage;
  const { data, total } = await reviewRepository.findManyWithOffset(offset, perPage);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export const reviewService = { create, getMy, list };
