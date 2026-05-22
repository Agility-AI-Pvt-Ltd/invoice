import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createExpenseLedgerEntry,
  listExpenseLedgerEntries,
} from "@/lib/expenses/ledger";
import { ledgerCreateSchema } from "@/lib/expenses/schemas";

export async function GET(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const kind = url.searchParams.get("kind");
    const limit = Number(url.searchParams.get("limit") ?? undefined);
    const offset = Number(url.searchParams.get("offset") ?? undefined);

    const result = await listExpenseLedgerEntries(organizationId, {
      from,
      to,
      kind,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("[expenses/ledger GET]", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    const status = message.startsWith("Invalid ") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = ledgerCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const row = await createExpenseLedgerEntry(organizationId, parsed.data);
    return NextResponse.json(row);
  } catch (e) {
    console.error("[expenses/ledger POST]", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    const status = message.startsWith("Invalid ") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
