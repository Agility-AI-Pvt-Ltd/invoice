import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../../lib/auth";

const VALID_STATUSES = ["DRAFT", "SENT", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

// Manual status transitions that make no financial sense are blocked server-side.
// PAID can only be set via the payment route (which validates the amount).
const BLOCKED_MANUAL = ["PAID", "PARTIALLY_PAID"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    if (!user || !user.ownedOrgs || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = user.ownedOrgs[0].id;
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (BLOCKED_MANUAL.includes(status)) {
      return NextResponse.json(
        { error: "Use the Record Payment flow to mark invoices as paid." },
        { status: 400 }
      );
    }

    const existing = await prisma.invoice.findUnique({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (existing.status === "PAID") {
      return NextResponse.json({ error: "Cannot change status of a paid invoice." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.invoice.update({ where: { id, organizationId }, data: { status } }),
      prisma.activityLog.create({
        data: {
          organizationId,
          entity: "Invoice",
          entityId: id,
          action: "STATUS_CHANGED",
          meta: { from: existing.status, to: status },
        },
      }),
    ]);

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("[status]", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
