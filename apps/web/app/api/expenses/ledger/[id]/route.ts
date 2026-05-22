import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteExpenseLedgerEntry,
  updateExpenseLedgerEntry,
} from "@/lib/expenses/ledger";
import { ledgerPatchSchema } from "@/lib/expenses/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = ledgerPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const row = await updateExpenseLedgerEntry(organizationId, id, parsed.data);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (e) {
    console.error("[expenses/ledger/:id PATCH]", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    const status = message.startsWith("Invalid ") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await deleteExpenseLedgerEntry(organizationId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[expenses/ledger/:id DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
