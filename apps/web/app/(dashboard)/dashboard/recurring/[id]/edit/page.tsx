import { requireAuth } from "../../../../../../lib/auth";
import { prisma } from "@repo/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import EditRecurringForm from "./EditRecurringForm";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    redirect("/onboarding");
  }

  const recurring = await prisma.recurringInvoice.findFirst({
    where: { id, organizationId },
    include: { items: true, customer: true },
  });

  if (!recurring) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Not found</h1>
          <p className="text-muted-foreground mt-2">This recurring invoice schedule does not exist.</p>
          <Link
            href="/dashboard/recurring"
            className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    select: { id: true, name: true, stateCode: true, email: true, phone: true },
    orderBy: { name: "asc" },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stateCode: true, defaultDueDays: true },
  });

  const recurringForForm = {
    id: recurring.id,
    title: recurring.title,
    interval: recurring.interval,
    nextIssueDate: recurring.nextIssueDate,
    endDate: recurring.endDate,
    dueDays: recurring.dueDays,
    autoSend: recurring.autoSend,
    notes: recurring.notes,
    customerId: recurring.customerId,
    customer: recurring.customer,
    items: recurring.items.map((item) => ({
      id: item.id,
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice) / 100,
      taxRate: Number(item.taxRate),
    })),
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/recurring/${id}`} className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Edit Subscription</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Update the schedule, items, or billing details.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Editing a subscription schedule updates it immediately. Invoices already generated from this schedule will not be
          affected.
        </p>
        <EditRecurringForm
          recurring={recurringForForm}
          customers={customers}
          orgStateCode={organization?.stateCode || ""}
        />
      </div>
    </div>
  );
}
