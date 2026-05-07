# 🔧 API Developer Quick Reference

> **Quick Guide** for adding new API endpoints following the security patterns established in this session.

---

## ✅ Minimum Template for New API Endpoint

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '@/lib/auth';
import { checkAuthRateLimit } from '@/lib/ratelimit';
import { 
  yourInputSchema, 
  validateRequestBody 
} from '@/lib/validation-schemas';
import {
  verifyOrgAccess,
  createErrorResponse,
  logApiAction,
} from '@/lib/api-utils';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;

    // 1. Verify organization access
    const orgAccess = verifyOrgAccess(user, organizationId);
    if (!orgAccess.hasAccess) {
      return NextResponse.json(
        { error: orgAccess.error.message },
        { status: orgAccess.error.statusCode }
      );
    }
    const orgId = orgAccess.org.id;

    // 2. Apply rate limiting (optional, but recommended for sensitive ops)
    const rateLimit = await checkAuthRateLimit(`your-endpoint:${orgId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // 3. Validate input
    const validation = await validateRequestBody(req, yourInputSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    // 4. Perform business logic
    const result = await prisma.yourModel.create({
      data: {
        organizationId: orgId,
        ...data,
      },
    });

    // 5. Log action
    await logApiAction(orgId, 'YourEntity', result.id, 'CREATED', {
      summary: 'what was created',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return createErrorResponse(err, 'POST /api/your-endpoint');
  }
}
```

---

## 📝 Adding Input Validation

### Step 1: Define Zod Schema

In `lib/validation-schemas.ts`:

```typescript
export const createYourThingSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  email: z.string().email('Invalid email').optional(),
  amount: z.number().positive('Must be positive'),
  date: z.string().datetime('Invalid date format'),
});

export type CreateYourThingInput = z.infer<typeof createYourThingSchema>;
```

### Step 2: Use in Endpoint

```typescript
const validation = await validateRequestBody(req, createYourThingSchema);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
const { name, email, amount, date } = validation.data;
```

### Step 3: Test

```bash
# Valid request
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","amount":100,"date":"2026-05-06T00:00:00Z"}'

# Invalid request (should get 400)
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"name":"","amount":-10}'
```

---

## 🚨 Error Handling Patterns

### Pattern 1: Validation Errors
```typescript
const validation = await validateRequestBody(req, schema);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### Pattern 2: Not Found
```typescript
const item = await prisma.model.findUnique({ where: { id, organizationId: orgId } });
if (!item) {
  return NextResponse.json({ error: 'Item not found' }, { status: 404 });
}
```

### Pattern 3: Business Logic Error
```typescript
if (invoice.status === 'PAID') {
  return NextResponse.json(
    { error: 'Cannot modify paid invoice' },
    { status: 400 }
  );
}
```

### Pattern 4: Generic Error (Catch Block)
```typescript
catch (err) {
  return createErrorResponse(err, 'POST /api/endpoint-name');
}
```

**Never expose error details to client:**
```typescript
// ❌ BAD
return NextResponse.json({ error: err.message }, { status: 500 });

// ✅ GOOD
return createErrorResponse(err, 'POST /api/endpoint');
// Details logged server-side, generic message sent to client
```

---

## 🔐 Organization Access Pattern

**Every database query MUST include organizationId check:**

```typescript
// ❌ MISSING ORG CHECK
const invoice = await prisma.invoice.findUnique({ where: { id } });

// ✅ CORRECT
const invoice = await prisma.invoice.findUnique({ 
  where: { id, organizationId: orgId }  // Both conditions!
});
```

**Why?** Prevents users from accessing other organizations' data through ID guessing.

---

## 📊 Rate Limiting

### When to Apply
- ✅ **Authentication** (login, register)
- ✅ **Payments** (payment recording, payment link generation)
- ✅ **Email** (sending emails)
- ✅ **External Integrations** (webhooks, exports)
- ❌ **NOT** for reads (list, get details)

### Implementation
```typescript
const rateLimit = await checkAuthRateLimit(`operation:${orgId}`);
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: `Too many requests. Retry in ${rateLimit.retryAfter}s.` },
    { status: 429 }
  );
}
```

---

## 📜 Audit Logging

### Log Success Operations
```typescript
await logApiAction(orgId, 'Invoice', invoice.id, 'CREATED', {
  invoiceNumber: invoice.invoiceNumber,
  total: invoice.total,
});
```

### Log Failed Operations (in catch block)
```typescript
catch (err) {
  await logApiAction(orgId, 'Invoice', id, 'PAYMENT_FAILED', {
    reason: err.message,
    amount,
  }).catch(() => {}); // Ensure logging doesn't block error response
  
  return createErrorResponse(err, context);
}
```

### What to Log
- ✅ **Success:** What was created/modified/deleted
- ✅ **Failure:** Why operation failed (for investigation)
- ✅ **Sensitive:** Amounts, user actions, status changes
- ❌ **NOT:** Full request bodies with sensitive data
- ❌ **NOT:** Database passwords, API keys, tokens

---

## 🔢 Working with Decimal Values

**Problem:** JavaScript floats can lose precision in financial calculations.

**Solution:** Keep amounts as numbers in JavaScript, Prisma handles Decimal type:

```typescript
// ✅ CORRECT
const amount: number = 1000.50;  // User provides as number
const payment = await prisma.payment.create({
  data: { amount }  // Prisma converts to Decimal
});

// For comparison, use tolerance
const TOLERANCE = 0.01;
if (amount > remaining + TOLERANCE) {
  // Overpaid!
}

// ❌ WRONG - don't use Decimal.js unless absolutely needed
import Decimal from 'decimal.js';
const d = new Decimal(amount);  // Unnecessary complexity
```

---

## 🧪 Testing New Endpoints

### Happy Path
```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"valid":"data"}'

# Expected: 201 or 200 with result
```

### Validation Failure
```bash
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'

# Expected: 400 with error message
```

### Rate Limit
```bash
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/endpoint \
    -H "Content-Type: application/json" \
    -d '{}'
done

# Expected: 429 on requests 11+
```

### Organization Isolation
```bash
# As User A, try to access User B's data
curl -X GET http://localhost:3000/api/invoices?userId=user-b-id

# Expected: 404 or 403 (data not found / forbidden)
```

---

## 🎯 Common Patterns Checklist

When creating a new endpoint, ensure:

- [ ] Endpoint uses `verifyOrgAccess()` to check user owns org
- [ ] All database queries include `organizationId` filter
- [ ] Input is validated with Zod schema via `validateRequestBody()`
- [ ] Errors use `createErrorResponse()` (or return sanitized error)
- [ ] Sensitive operations have rate limiting
- [ ] Success operations are logged with `logApiAction()`
- [ ] Failed operations are logged in catch block
- [ ] Generic catch block calls `createErrorResponse(err, context)`
- [ ] `npm run check-types` passes (strict TypeScript)
- [ ] No `as any` casts used
- [ ] All monetary values use Number (not Decimal)

---

## 🚀 Adding New Validation Schema

### Template
```typescript
export const yourOperationSchema = z.object({
  field1: z.string().min(1, 'Field1 required').max(255),
  field2: z.number().positive('Must be positive'),
  field3: z.enum(['OPTION_A', 'OPTION_B']),
  field4: z.string().email().optional(),
});

export type YourOperationInput = z.infer<typeof yourOperationSchema>;
```

### Common Zod Patterns
```typescript
// Strings
z.string().min(1).max(255)
z.string().email()
z.string().regex(/^\d{10}$/, 'Must be 10 digits')
z.string().length(2, 'Must be exactly 2 chars')

// Numbers
z.number().positive('Must be > 0')
z.number().nonnegative('Must be >= 0')
z.number().min(0).max(100)
z.number().int('Must be integer')

// Enums
z.enum(['DRAFT', 'SENT', 'PAID'])

// Optional
z.string().optional()
z.string().optional().nullable()

// Dates
z.string().datetime()
z.date()

// Arrays
z.array(z.string()).min(1, 'At least 1 required')
```

---

## 📚 File Reference

| File | Purpose | When to Edit |
|------|---------|-------------|
| `lib/validation-schemas.ts` | All input validators | Adding new endpoints |
| `lib/api-utils.ts` | Error handling, org access | Rarely - extends existing patterns |
| `lib/ratelimit.ts` | Rate limiting config | Adjusting limits |
| `middleware.ts` | Global security headers | Rarely - set once |
| Individual route files | Endpoint logic | For each new endpoint |

---

## 🆘 Debugging

### Type Errors
```bash
npm run check-types
# Review the error, check usage matches schema type
```

### Validation Rejecting Valid Data
```bash
# Check schema in validation-schemas.ts
# Test with Zod directly:
const result = yourSchema.safeParse(data);
console.log(result); // See why it failed
```

### Rate Limiting Not Working
```bash
# Check Upstash Redis credentials:
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# If empty, rate limiting is disabled (fail-open for dev)
```

### Org Access Denied (403)
```bash
# Verify organizationId matches user's ownedOrgs
# Check database: SELECT * FROM "User" WHERE id = 'your-id';
```

---

## ✨ Example: Complete New Endpoint

**Goal:** Add endpoint to record a refund

```typescript
// 1. Add validation schema
// In lib/validation-schemas.ts
export const recordRefundSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive('Amount must be > 0'),
  reason: z.string().min(1, 'Reason required').max(500),
  method: z.enum(['BANK_TRANSFER', 'CASH', 'CREDIT']).optional(),
});

// 2. Create endpoint
// apps/web/app/api/invoices/[id]/refund/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '@/lib/auth';
import { recordRefundSchema, validateRequestBody } from '@/lib/validation-schemas';
import { verifyOrgAccess, createErrorResponse, logApiAction } from '@/lib/api-utils';

export async function POST(req: Request) {
  try {
    const user = await getSession();
    const orgAccess = verifyOrgAccess(user, user?.ownedOrgs?.[0]?.id);
    if (!orgAccess.hasAccess) {
      return NextResponse.json(
        { error: orgAccess.error.message },
        { status: orgAccess.error.statusCode }
      );
    }
    const orgId = orgAccess.org.id;

    const validation = await validateRequestBody(req, recordRefundSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { invoiceId, amount, reason, method } = validation.data;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, organizationId: orgId },
      include: { payments: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
    if (amount > totalPaid) {
      return NextResponse.json(
        { error: 'Refund amount exceeds payments' },
        { status: 400 }
      );
    }

    const refund = await prisma.payment.create({
      data: {
        invoiceId,
        amount: -amount, // Negative for refund
        method: method || 'BANK_TRANSFER',
        notes: `Refund: ${reason}`,
      },
    });

    await logApiAction(orgId, 'Invoice', invoiceId, 'REFUND_RECORDED', {
      refundId: refund.id,
      amount,
      reason,
    });

    return NextResponse.json(refund, { status: 201 });
  } catch (err) {
    return createErrorResponse(err, 'POST /api/invoices/[id]/refund');
  }
}
```

---

## 🎓 Best Practices Summary

✅ **Always:**
- Validate input with Zod schemas
- Verify organization access on all database queries
- Log important operations
- Use consistent error responses
- Use `npm run check-types` before committing

❌ **Never:**
- Expose error details to clients
- Skip organization checks
- Use `as any` type casts
- Log sensitive data (passwords, tokens)
- Return database errors directly

---

*Last Updated: May 6, 2026  
For questions, refer to updated API endpoints for pattern examples.*
