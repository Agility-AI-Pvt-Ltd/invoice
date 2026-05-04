import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import InvoiceActions from './InvoiceActions';

const fmt = (n: number) => `₹${n.toFixed(2)}`;

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId },
    include: { customer: true, items: true, organization: true, payments: true },
  });

  if (!invoice) notFound();

  const isInterState = invoice.organization.stateCode !== invoice.placeOfSupply;
  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = invoice.total - totalPaid;

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All Invoices
          </Link>
          {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded-md transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </Link>
          )}
        </div>
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status as any}
          total={invoice.total}
          paid={totalPaid}
          defaultTemplate={(invoice.organization as any).defaultTemplate ?? "modern"}
        />
      </div>

      {/* Payment summary bar */}
      {totalPaid > 0 && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-green-800 font-medium">₹{totalPaid.toFixed(2)} received</span>
          {remaining > 0 && <span className="text-green-700">₹{remaining.toFixed(2)} remaining</span>}
        </div>
      )}

      {/* Invoice document */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{invoice.organization.name}</h1>
              {invoice.organization.gstin && (
                <p className="text-xs text-gray-500 mt-1">GSTIN: {invoice.organization.gstin}</p>
              )}
              {invoice.organization.address && (
                <p className="text-xs text-gray-500">{invoice.organization.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">#{invoice.invoiceNumber}</p>
              <p className="text-xs text-gray-500 mt-1">
                Issued: {new Date(invoice.issueDate).toLocaleDateString('en-IN')}
              </p>
              <p className="text-xs text-gray-500">
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To / From */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
            {invoice.customer.gstin && <p className="text-xs text-gray-500">GSTIN: {invoice.customer.gstin}</p>}
            {invoice.customer.stateCode && <p className="text-xs text-gray-500">State: {invoice.customer.stateCode}</p>}
            {invoice.customer.email && <p className="text-xs text-gray-500">{invoice.customer.email}</p>}
            {invoice.customer.address && <p className="text-xs text-gray-500">{invoice.customer.address}</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Supply Info</p>
            <p className="text-xs text-gray-600">Place of supply: {invoice.placeOfSupply}</p>
            <p className="text-xs text-gray-600">Tax type: {isInterState ? 'IGST (Inter-state)' : 'CGST + SGST (Intra-state)'}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="px-8 py-6 border-b border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 text-left">Description</th>
                <th className="pb-3 text-left">HSN</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">GST</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.items.map((item) => (
                <tr key={item.id} className="text-gray-700">
                  <td className="py-3 font-medium text-gray-900">{item.description}</td>
                  <td className="py-3 text-gray-400 text-xs">{item.hsnCode || '—'}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{fmt(item.unitPrice)}</td>
                  <td className="py-3 text-right text-gray-500">{item.taxRate}%</td>
                  <td className="py-3 text-right font-medium">{fmt(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 flex justify-end border-b border-gray-100">
          <div className="w-56 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{fmt(invoice.subTotal)}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between text-gray-600">
                <span>IGST</span><span>{fmt(invoice.igstTotal)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-gray-600"><span>CGST</span><span>{fmt(invoice.cgstTotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST</span><span>{fmt(invoice.sgstTotal)}</span></div>
              </>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span><span>{fmt(invoice.total)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-green-700 text-sm">
                  <span>Paid</span><span>— {fmt(totalPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Balance Due</span><span>{fmt(Math.max(0, remaining))}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment history */}
        {invoice.payments.length > 0 && (
          <div className="px-8 py-5 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Payment History</p>
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</span>
                    {p.method && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.method}</span>}
                    {p.notes && <span className="text-gray-400 text-xs">{p.notes}</span>}
                  </div>
                  <span className="font-medium text-green-700">+ {fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 flex justify-between items-center">
          <p className="text-xs text-gray-400">Generated by InvoiceHQ</p>
          <p className="text-xs text-gray-400">Thank you for your business.</p>
        </div>
      </div>
    </div>
  );
}
