import { z } from "zod";

export const listLessonFilesSchema = z.object({
  module_id: z.coerce.number().int().positive("module_id is required"),
  activity_type_id: z.coerce.number().int().positive("activity_type_id is required"),
  season_id: z.coerce.number().int().positive("season_id is required"),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type ListLessonFilesInput = z.infer<typeof listLessonFilesSchema>;

export const uploadLessonFileSchema = z.object({
  module_id: z.coerce.number().int().positive(),
  activity_type_id: z.coerce.number().int().positive(),
  season_id: z.coerce.number().int().positive(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export type UploadLessonFileInput = z.infer<typeof uploadLessonFileSchema>;

export const uploadLessonFilesSchema = z.object({
  module_id: z.coerce.number().int().positive(),
  activity_type_id: z.coerce.number().int().positive(),
  season_id: z.coerce.number().int().positive(),
});

export type UploadLessonFilesInput = z.infer<typeof uploadLessonFilesSchema>;
