import { z } from "zod";

export const ledgerCreateSchema = z.object({
  kind: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive().finite(),
  occurredAt: z.string().min(4),
  description: z.string().trim().max(500).optional().nullable(),
  currency: z.string().trim().length(3).optional().default("INR"),
});

export const ledgerPatchSchema = ledgerCreateSchema.partial();

export const budgetUpsertSchema = z.object({
  category: z.string().trim().min(1).max(120),
  limitAmount: z.coerce.number().positive().finite(),
  currency: z.string().trim().length(3).optional().default("INR"),
});
