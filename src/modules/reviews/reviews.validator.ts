import { z } from "zod";

export const createReviewSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(3, "Comment must be at least 3 characters")
    .max(1000, "Comment must be at most 1000 characters"),
});

export const listReviewsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewsInput = z.infer<typeof listReviewsSchema>;
