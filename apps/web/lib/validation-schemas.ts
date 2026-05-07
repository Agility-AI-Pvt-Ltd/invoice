import { z } from 'zod';

// Customer Validation
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .optional()
    .nullable(),
  gstin: z
    .string()
    .regex(/^[A-Z0-9]{15}$/, 'Invalid GSTIN format')
    .optional()
    .nullable(),
  stateCode: z
    .string()
    .length(2, 'State code must be exactly 2 characters')
    .toUpperCase(),
  address: z.string().max(500, 'Address too long').optional().nullable(),
  isRegistered: z.boolean().optional().default(false),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// Invoice Item Validation
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required').max(500),
  hsnCode: z.string().max(8).optional().nullable(),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Price cannot be negative'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be 0-100'),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// Invoice Creation Validation
export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number required').max(50),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  customerNameOrId: z.string().min(1, 'Customer required'),
  customerStateCode: z.string().length(2).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  placeOfSupply: z.string().length(2).optional(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// Payment Recording Validation
export const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.string().max(50).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// Recurring Invoice Validation
export const createRecurringInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  title: z.string().max(255).optional(),
  interval: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  nextIssueDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  dueDays: z.number().int().min(0).max(365),
  autoSend: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
});

export type CreateRecurringInvoiceInput = z.infer<typeof createRecurringInvoiceSchema>;

// Status Update Validation
export const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

// Payment Gateway Config Validation
export const paymentGatewayConfigSchema = z.object({
  provider: z.enum(['RAZORPAY', 'PAYTM', 'STRIPE', 'CASHFREE']),
  keyId: z.string().min(1, 'Key ID required'),
  keySecret: z.string().min(1, 'Key secret required'),
  webhookSecret: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type PaymentGatewayConfigInput = z.infer<typeof paymentGatewayConfigSchema>;

// Helper to validate and parse request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
  maxSizeBytes = 5 * 1024 * 1024 // 5MB default
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  // Check content length
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    return {
      success: false,
      error: `Request payload exceeds ${maxSizeBytes / 1024 / 1024}MB limit`,
    };
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { success: false, error: 'Invalid JSON' };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    const fieldPath = firstError?.path.join('.') || 'unknown';
    const errorMsg = firstError?.message || 'Validation failed';
    return {
      success: false,
      error: `${fieldPath}: ${errorMsg}`,
    };
  }

  return { success: true, data: parsed.data };
}
