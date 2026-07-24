import z from "zod";

export const listSubscriptionDemandsSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const listSubscriptionsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const createSubscriptionDemandSchema = z.object({
  semester_id: z.number({ required_error: "semester_id is required" }).int().positive(),
  type: z.literal("premium").optional().default("premium"),
  speciality_id: z.number().int().positive().optional(),
});

export const processSubscriptionDemandSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  admin_note: z.string().max(500).optional(),
});
