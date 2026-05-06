import { NextResponse } from "next/server";
import { processRecurringInvoices } from "@/lib/process-recurring-invoices";

function verifyCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function handleCron(request: Request) {
  try {
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { processed, results } = await processRecurringInvoices();

    return NextResponse.json({
      processed,
      results,
    });
  } catch (error: unknown) {
    console.error("[cron/process-recurring]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Self-hosted crons often use GET; CLI is preferred when not exposing HTTP. */
export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
