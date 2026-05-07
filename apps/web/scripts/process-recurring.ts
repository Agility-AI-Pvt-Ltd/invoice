/**
 * Run recurring invoice generation without Vercel (e.g. systemd timer, crontab, k8s CronJob).
 *
 * Usage (from repo root):
 *   npm run process-recurring -w web
 *
 * Requires DATABASE_URL in the environment (.env at repo root or apps/web).
 */
import { prisma } from "@repo/db";
import { processRecurringInvoices } from "../lib/process-recurring-invoices";

async function main() {
  const { processed, results } = await processRecurringInvoices();
  console.log(JSON.stringify({ processed, results }, null, 2));
  const errors = results.filter((r) => r.status === "error");
  await prisma.$disconnect();
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
