# 🚀 Pre-Deployment Checklist

> **Last Updated:** May 6, 2026  
> **Status:** Ready for Implementation  
> **Estimated Effort:** 1-2 days for remaining items

---

## ✅ COMPLETED IN THIS SESSION

### Security Hardening
- [x] **Middleware Security Headers** (`middleware.ts`)
  - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
  - HSTS (production only)
  - CSP, Permissions-Policy
  - Referrer-Policy

- [x] **Cookie Security** (Verified in `login/actions.ts`, `register/actions.ts`)
  - HttpOnly flag enabled
  - Secure flag (production only)
  - SameSite=strict for CSRF protection
  - 7-day expiration

### Input Validation
- [x] **Validation Schemas** (`lib/validation-schemas.ts`)
  - Customer creation with email/phone/GSTIN validation
  - Invoice item validation with quantity/price checks
  - Invoice creation with date validation
  - Payment recording with amount validation
  - Recurring invoice schema
  - Request body size limit validation helper

### API Error Handling
- [x] **Consistent Error Responses** (`lib/api-utils.ts`)
  - ApiError class with status codes
  - Error response helper with context logging
  - Organization access verification
  - Type-safe response wrappers
  - Audit logging helper

### Updated Endpoints
- [x] POST `/api/customers` - Added validation, duplicate check, logging
- [x] POST `/api/invoices/[id]/payment` - Rate limiting, validation, Decimal tolerance
- [x] POST `/api/webhooks/razorpay` - Enhanced logging, safety checks, transaction guards
- [x] POST `/api/invoices/[id]/payment-link` - Rate limiting, type safety, better error handling
- [x] GET `/api/invoices/[id]/pdf` - Template validation, cache headers, error logging
- [x] POST `/api/invoices/[id]/send-email` - Organization access check, error sanitization
- [x] PATCH `/api/invoices/[id]/status` - Validation schema, transition rules, error handling

---

## 📋 REMAINING TASKS (BEFORE DEPLOYMENT)

### 1. Database Migration
**Priority:** CRITICAL  
**Time:** 5 minutes

```bash
# In apps/web or root:
npm run db:migrate -- --name add_security_enhancements

# Or if using Prisma workspace:
cd packages/db
npx prisma migrate dev --name add_security_enhancements
```

**What it does:** Creates any pending database migrations. (In this session, no schema changes were made beyond what's already in the codebase.)

---

### 2. Environment Variables
**Priority:** CRITICAL  
**Time:** 10 minutes

Add to `.env.local` (development) and Vercel dashboard (production):

```bash
# Cron Job Authentication
CRON_SECRET=your-secure-random-token-here-min-32-chars

# Example: Generate secure token
# openssl rand -base64 32

# Optional: Email Configuration (if not already set)
EMAIL_PROVIDER=RESEND  # or SMTP or SENDGRID
RESEND_API_KEY=re_xxxx  # if using Resend

# Optional: Rate Limiting (required for production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Verification:**
```bash
# Test environment loading
node -e "require('dotenv').config(); console.log(process.env.CRON_SECRET ? '✓ CRON_SECRET set' : '✗ CRON_SECRET missing')"
```

---

### 3. Type Checking
**Priority:** HIGH  
**Time:** 15 minutes

```bash
# Run type checker
npm run check-types

# Fix any TypeScript errors reported
# Most errors will be in the updated API routes

# Enable strict mode in tsconfig.json (if not already)
# Edit apps/web/tsconfig.json:
# "strict": true,
# "noImplicitAny": true,
```

---

### 4. Linting
**Priority:** HIGH  
**Time:** 10 minutes

```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npx eslint --fix apps/web/app/api apps/web/lib

# Review remaining warnings
npm run lint
```

---

### 5. Cron Job Setup (Vercel)
**Priority:** CRITICAL  
**Time:** 5 minutes

**Already Done:** `vercel.json` is configured in the plan. Verify it exists:

```bash
# Check if vercel.json exists
ls -la apps/web/vercel.json

# Content should include:
# {
#   "crons": [
#     {
#       "path": "/api/cron/process-recurring",
#       "schedule": "30 20 * * *"
#     }
#   ]
# }
```

**Deployment Steps:**
1. Ensure `CRON_SECRET` is set in Vercel environment
2. Deploy to Vercel (automatic with git push)
3. Test cron manually:
   ```bash
   curl -H "Authorization: Bearer your-cron-secret" \
     https://yourdomain.com/api/cron/process-recurring
   ```

---

### 6. Test All Updated Endpoints
**Priority:** HIGH  
**Time:** 30 minutes

#### 6.1 Payment Recording
```bash
# Test with valid payment
curl -X POST http://localhost:3000/api/invoices/INVOICE_ID/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "method": "bank_transfer", "notes": "Test"}'

# Expected: { "success": true, "newStatus": "PARTIALLY_PAID", "paymentId": "..." }
```

#### 6.2 Customer Creation
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "stateCode": "MH",
    "phone": "9876543210"
  }'

# Expected: { "id": "...", "name": "Test Customer", "stateCode": "MH", "email": "test@example.com" }
```

#### 6.3 Status Transitions
```bash
# Test valid transition
curl -X PATCH http://localhost:3000/api/invoices/INVOICE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "SENT"}'

# Test blocked transition (should fail)
curl -X PATCH http://localhost:3000/api/invoices/INVOICE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID"}'

# Expected error: { "error": "Use the Record Payment flow..." }
```

---

### 7. Security Headers Verification
**Priority:** HIGH  
**Time:** 10 minutes

Test with:
```bash
# Check headers are present
curl -I http://localhost:3000/dashboard

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# X-XSS-Protection: 1; mode=block
```

Or use online tool: https://securityheaders.com (enter your deployed URL)

---

### 8. Rate Limiting Verification
**Priority:** MEDIUM  
**Time:** 10 minutes

If Upstash Redis is configured:

```bash
# Test rate limit on payment endpoint
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/invoices/TEST/payment \
    -H "Content-Type: application/json" \
    -d '{"amount": 10}'
done

# After 10 requests in 15 minutes, should get 429 Too Many Requests
```

---

### 9. Database Backup (Production Only)
**Priority:** CRITICAL  
**Time:** 5 minutes

Before deploying to production:

```bash
# Backup PostgreSQL database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
wc -l backup_*.sql

# Store safely (S3, backup service, etc.)
```

---

### 10. Logging Configuration
**Priority:** MEDIUM  
**Time:** Optional, but recommended

Set up structured logging for production:

```bash
# Add to Vercel environment variables:
LOG_LEVEL=info
# Optional: integrate with service like:
# - Sentry (error tracking)
# - DataDog (monitoring)
# - CloudWatch (AWS)
# - Loggly (logging service)
```

Current logs go to console (Vercel captures and displays in dashboard).

---

## 🧪 TESTING CHECKLIST

### Unit Tests
```bash
# Create test file for new validation schemas
touch apps/web/__tests__/lib/validation-schemas.test.ts

# Create test file for API utils
touch apps/web/__tests__/lib/api-utils.test.ts

# Run tests (if test runner is configured)
npm run test
```

**Test Cases to Add:**
- [ ] Validation schemas reject invalid inputs
- [ ] API error responses sanitize details
- [ ] Rate limiting blocks requests correctly
- [ ] Cron job processes recurring invoices
- [ ] Webhook signature verification works
- [ ] Payment status transitions are valid

---

### Integration Tests
- [ ] Create invoice → generate payment link → record payment
- [ ] Recurring invoice → auto-generate invoice → send email
- [ ] Customer creation with duplicate name check
- [ ] Status transitions respect business rules

---

### Load Testing
```bash
# Optional: Use k6 or Artillery for load testing
# Test endpoints with 100+ concurrent requests
# Verify rate limiting works under load
```

---

## 🔒 Security Verification Checklist

- [ ] **Cookie Security**
  - [ ] HttpOnly flag set
  - [ ] Secure flag set (production)
  - [ ] SameSite=strict
  - [ ] 7-day expiration

- [ ] **Headers**
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-Frame-Options: DENY
  - [ ] CSP properly configured
  - [ ] HSTS (production)

- [ ] **Input Validation**
  - [ ] All POST/PATCH endpoints validate input
  - [ ] Request body size limits enforced
  - [ ] Email/phone formats validated
  - [ ] State codes validated

- [ ] **Rate Limiting**
  - [ ] Login endpoint limited
  - [ ] Payment endpoints limited
  - [ ] Email send limited
  - [ ] Webhook endpoints protected

- [ ] **Authorization**
  - [ ] Organization access verified on all endpoints
  - [ ] No data leakage between orgs
  - [ ] Admin-only endpoints protected

- [ ] **Error Handling**
  - [ ] No internal details in error messages
  - [ ] Database errors sanitized
  - [ ] Sensitive data not logged
  - [ ] Failed operations logged (for audit)

- [ ] **Cron Job**
  - [ ] CRON_SECRET validated
  - [ ] Signature verification strong
  - [ ] Idempotency guaranteed

---

## 🚀 DEPLOYMENT STEPS

### Staging Environment
```bash
# 1. Deploy to staging first
git push origin main  # or feature branch

# 2. Run migrations on staging
npm run db:migrate

# 3. Test all endpoints in staging
# Use Postman or similar

# 4. Load test if possible
# npm run load-test

# 5. Security scan
# npm audit
```

### Production Environment
```bash
# 1. Verify all staging tests pass
# 2. Back up production database
# 3. Merge to main and push
# 4. Vercel automatically deploys
# 5. Run migrations (if needed)
# 6. Verify cron job in Vercel dashboard
# 7. Test critical endpoints
# 8. Monitor logs for errors
```

---

## 📊 Post-Deployment Monitoring

### Day 1 (Launch)
- [ ] Monitor error rates (should be < 0.1%)
- [ ] Check API response times (should be < 500ms)
- [ ] Verify email delivery (check Resend/SendGrid dashboard)
- [ ] Monitor database query performance
- [ ] Check Upstash Redis hit rates

### Week 1
- [ ] Review activity logs for suspicious patterns
- [ ] Check recurring invoice generation (if schedule runs)
- [ ] Monitor customer support for issues
- [ ] Collect error metrics

### Ongoing
- [ ] Set up alerts for:
  - Error rate spike (> 1%)
  - Response time spike (> 1000ms)
  - Rate limit hits (unusual activity)
  - Database connection pool exhaustion
  - Email delivery failures

---

## 🔄 Rollback Plan

If critical issues occur:

```bash
# 1. Revert code
git revert HEAD

# 2. Redeploy previous version
git push origin main

# 3. Restore database backup
pg_restore $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 4. Notify team
# 5. Post-mortem investigation

# Timeline to restore: < 15 minutes
```

---

## 📞 Support & Escalation

**For Issues:**
1. Check logs in Vercel dashboard
2. Review recent changes in git
3. Test in staging environment
4. Roll back if necessary
5. Post-mortem to prevent recurrence

**Contact:** Security/DevOps team on Slack

---

## ✨ FINAL VERIFICATION

Before marking deployment as complete:

```bash
# Run comprehensive checks
npm run build
npm run check-types
npm run lint
npm run test  # (if tests exist)

# Manual verification
curl https://yourdomain.com/health

# Expected response:
# { "status": "ok", "timestamp": "2026-05-06T..." }
```

---

**Deployment Status:** 🟡 READY (Awaiting final testing & go-live)

**Go-Live Decision:** Awaits QA sign-off and business approval
