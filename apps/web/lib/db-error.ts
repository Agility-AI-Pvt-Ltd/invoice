/** User-facing hint when Postgres rejects DATABASE_URL credentials (Neon password rotated, etc.). */
export function isDatabaseAuthFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const text = error.message;
  if (/28P01|password authentication failed/i.test(text)) return true;

  const meta = (error as { meta?: { code?: string; message?: string } }).meta;
  if (meta?.code === "28P01") return true;
  if (meta?.message && /password authentication failed/i.test(meta.message)) {
    return true;
  }
  return false;
}

export function databaseFailureMessage(error: unknown): string | null {
  if (isDatabaseAuthFailure(error)) {
    return "Sign-in is unavailable: the deployed database password is wrong. Update DATABASE_URL in Vercel from Neon, then redeploy.";
  }
  if (
    error instanceof Error &&
    /DATABASE_URL|connect|ECONNREFUSED|timeout/i.test(error.message)
  ) {
    return "Cannot reach the database. Check DATABASE_URL in your deployment settings.";
  }
  return null;
}
