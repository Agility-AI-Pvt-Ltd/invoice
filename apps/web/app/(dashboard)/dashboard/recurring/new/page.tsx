import { requireAuth } from '../../../../../lib/auth';
import { prisma } from '@repo/db';
import RecurringForm from './RecurringForm';

export default async function NewRecurringPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    select: { id: true, name: true, stateCode: true, email: true, phone: true },
    orderBy: { name: 'asc' },
  });

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stateCode: true, defaultDueDays: true },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Create Subscription Schedule</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Set up an automated invoice schedule for recurring billing.</p>
      </div>
      <RecurringForm customers={customers} orgStateCode={organization?.stateCode || ''} defaultDueDays={organization?.defaultDueDays || 30} />
    </div>
  );
}
