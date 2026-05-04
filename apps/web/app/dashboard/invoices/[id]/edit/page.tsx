import { prisma } from '@repo/db';
import { requireAuth } from '../../../../../lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import InvoiceForm from '../../new/InvoiceForm';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const [invoice, customers, products, organization] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { customer: true, items: true },
    }),
    prisma.customer.findMany({
      where: { organizationId },
      select: { id: true, name: true, stateCode: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { organizationId },
      select: { id: true, name: true, price: true, hsnCode: true, taxRate: true },
      orderBy: { name: 'asc' },
    }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);

  if (!invoice) notFound();

  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full">
        <Link href={`/dashboard/invoices/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Invoice
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium">
            This invoice is <strong>{invoice.status}</strong> and cannot be edited.
          </p>
          <p className="text-amber-700 text-sm mt-1">
            Only DRAFT and SENT invoices can be modified.
          </p>
        </div>
      </div>
    );
  }

  // Shape existing data for the form
  const existingData = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate.toISOString().split('T')[0],
    dueDate: invoice.dueDate.toISOString().split('T')[0],
    customerNameOrId: invoice.customer.id,
    placeOfSupply: invoice.placeOfSupply || '',
    notes: invoice.notes || '',
    items: invoice.items.map((item) => ({
      description: item.description,
      hsnCode: item.hsnCode || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  };

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/dashboard/invoices/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Edit Invoice</h1>
          <p className="text-sm text-gray-500">#{invoice.invoiceNumber} · {invoice.status}</p>
        </div>
      </div>

      <InvoiceForm
        customers={customers}
        products={products}
        orgStateCode={organization?.stateCode || '27'}
        defaultInvoiceNumber={invoice.invoiceNumber}
        defaultTemplate={organization?.defaultTemplate || 'modern'}
        editMode={true}
        existingData={existingData}
      />
    </div>
  );
}
