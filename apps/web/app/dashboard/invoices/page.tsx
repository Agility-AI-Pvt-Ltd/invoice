import { requireAuth } from '../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { FileText } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  OVERDUE: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
};

export default async function InvoicesPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{invoices.length} total</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No invoices yet.</p>
                  <Link href="/dashboard/invoices/new" className="text-sm text-gray-700 underline underline-offset-2 mt-1 inline-block">
                    Create your first invoice
                  </Link>
                </td>
              </tr>
            ) : invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 text-gray-600">{inv.customer.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">₹{inv.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[inv.status] || STATUS_STYLES.DRAFT}`}>
                    {inv.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
