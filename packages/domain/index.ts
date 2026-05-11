import { z } from "zod";

/**
 * Validates Indian GST State Codes (01-38, 97).
 */
export const stateCodeSchema = z
  .string()
  .regex(/^(0[1-9]|[1-2][0-9]|3[0-8]|97)$/, "Invalid Indian state code (must be 01-38 or 97)");

/**
 * Validates Indian Phone Numbers (10 digits starting with 6-9).
 */
export const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number (10 digits starting with 6-9)");

/**
 * Common Zod schemas for reuse across client and server.
 */
export const validationSchemas = {
  stateCode: stateCodeSchema,
  phone: indianPhoneSchema,
  email: z.string().email("Invalid email address"),
};

/**
 * Invoice item validation schema.
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
  discount: z.number().nonnegative("Discount cannot be negative").default(0),
  hsnCode: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
