import { z } from "zod";

export const userStatusSchema = z.enum(["active", "inactive", "locked", "suspended"]);

export const listUsersSchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().min(1).max(200).optional(),
});

export const updateUserSchema = z.object({
  status: userStatusSchema.optional(),
  first_name: z.string().min(2).max(50).regex(/^[A-Za-z]+$/).optional(),
  last_name: z.string().min(2).max(50).regex(/^[A-Za-z]+$/).optional(),
  avatar_file_id: z.number().int().positive().nullable().optional(),
});

export const updateProfileSchema = z
  .object({
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).nullable().optional(),
    phone_provider_id: z.number().int().positive().nullable().optional(),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    gender: z.enum(["Male", "Female"]).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
    avatar: z.string().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.phone_provider_id !== undefined && data.phone_provider_id !== null && data.phone === undefined) {
        return false;
      }
      return true;
    },
    { message: "phone_provider_id requires phone to be provided", path: ["phone_provider_id"] }
  );

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
