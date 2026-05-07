import { z } from "zod";

function localhostAppUrl(): string {
  const port = process.env.PORT?.trim() || "3000";
  return `http://localhost:${port}`;
}

/**
 * Public base URL for absolute links (email, webhooks copy, payment callbacks).
 * - Prefer explicit `NEXT_PUBLIC_APP_URL` (required for real deployments).
 * - On Vercel, `VERCEL_URL` is used when unset.
 * - Otherwise falls back to `http://localhost:<PORT>` (PORT defaults to 3000) so local
 *   `next dev` / `next start` work without `.env`; in production mode we log a warning
 *   so GCP and other deploys remind you to set the real URL.
 */
function resolvePublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[env] NEXT_PUBLIC_APP_URL is unset — using localhost for links. Set NEXT_PUBLIC_APP_URL to your public URL before deploying."
    );
  }

  return localhostAppUrl();
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Optional — rate limiting (fail-open if absent)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Optional — shared secret for /api/cron/* when triggered over HTTP (curl, k8s CronJob, etc.)
  CRON_SECRET: z.string().optional(),
  /** Optional — GCS bucket for direct uploads (signed URLs). */
  GCS_BUCKET_NAME: z.string().optional(),
  /** Max body size hint for clients (not enforced server-side on GCS). */
  GCS_SIGN_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().optional(),
  GCS_SIGN_UPLOAD_TTL_MS: z.coerce.number().int().positive().optional(),
});

function validateEnv() {
  const merged = {
    ...process.env,
    NEXT_PUBLIC_APP_URL: resolvePublicAppUrl(),
  };
  const result = envSchema.safeParse(merged);
  if (!result.success) {
    const missing = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`\n\n[env] Missing or invalid environment variables:\n${missing}\n`);
  }
  return result.data;
}

// Validate once at module load — fails loudly at boot, not silently at runtime
export const env = validateEnv();
