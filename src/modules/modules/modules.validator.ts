import { z } from "zod";

export const licenseModulesQuerySchema = z.object({
  semester_id: z.coerce.number().int().min(1),
});

export const masterModulesQuerySchema = z.object({
  semester_id: z.coerce.number().int().min(1),
  speciality_id: z.coerce.number().int().min(1),
});

export type LicenseModulesQueryInput = z.infer<typeof licenseModulesQuerySchema>;
export type MasterModulesQueryInput = z.infer<typeof masterModulesQuerySchema>;
