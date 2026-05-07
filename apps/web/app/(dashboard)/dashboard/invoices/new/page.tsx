import { prisma } from '@repo/db';
import InvoiceForm from './InvoiceForm';
import { requireAuth } from '../../../../../lib/auth';
import { generateNextInvoiceNumber } from '../../../../../lib/invoice-utils';

export default async function NewInvoicePage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const [customers, products, organization, lastInvoice] = await Promise.all([
    prisma.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true, stateCode: true, email: true, phone: true },
      orderBy: { name: 'asc' }
    }),
    prisma.product.findMany({
      where: { organizationId },
      select: { id: true, name: true, price: true, hsnCode: true, taxRate: true, productKind: true },
      orderBy: { name: 'asc' }
    }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
    prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    })
  ]);

  const nextInvoiceNumber = generateNextInvoiceNumber(lastInvoice?.invoiceNumber ?? null);

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">New Invoice</h1>
        <p className="text-sm text-gray-500">Fill in the details below to generate a GST invoice.</p>
      </div>
      <InvoiceForm
        customers={customers}
        products={products}
        orgStateCode={organization?.stateCode || '27'}
        defaultInvoiceNumber={nextInvoiceNumber}
        defaultTemplate={organization?.defaultTemplate || 'modern'}
      />
    </div>
  );
}
