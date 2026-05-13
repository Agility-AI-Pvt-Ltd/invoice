import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { updateStatusSchema, validateRequestBody } from "@/lib/validation-schemas";
import { verifyOrgAccess, createErrorResponse, logApiAction } from "@/lib/api-utils";

const BLOCKED_MANUAL = ["PAID", "PARTIALLY_PAID"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;

    const orgAccess = verifyOrgAccess(user, organizationId);
    if (!orgAccess.hasAccess) {
      return NextResponse.json(
        { error: orgAccess.error.message },
        { status: orgAccess.error.status }
      );
    }

    const orgId = orgAccess.org.id;

    // Validate request body
    const validation = await validateRequestBody(req, updateStatusSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { status } = validation.data;

    if (BLOCKED_MANUAL.includes(status)) {
      return NextResponse.json(
        { error: "Use the Record Payment flow to mark invoices as paid." },
        { status: 400 }
      );
    }

    const existing = await prisma.invoice.findUnique({ where: { id, organizationId: orgId } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (existing.status === "PAID") {
      return NextResponse.json(
        { error: "Cannot change status of a paid invoice." },
        { status: 400 }
      );
    }

    // Prevent invalid status transitions
    const invalidTransitions: Record<string, string[]> = {
      PAID: ["DRAFT", "SENT", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"],
      CANCELLED: ["DRAFT", "SENT", "PARTIALLY_PAID", "OVERDUE"],
    };

    if (invalidTransitions[existing.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change ${existing.status} invoice to ${status}` },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id, organizationId: orgId },
        data: { status },
      }),
      prisma.activityLog.create({
        data: {
          organizationId: orgId,
          entity: "Invoice",
          entityId: id,
          action: "STATUS_CHANGED",
          meta: { from: existing.status, to: status },
        },
      }),
    ]);

    return NextResponse.json({ success: true, status });
  } catch (err) {
    return createErrorResponse(err, "PATCH /api/invoices/[id]/status");
  }
}
