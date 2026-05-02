import { requireAuth } from '../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const [invoiceCount, customerCount, recentInvoices, revenueResult] = await Promise.all([
    prisma.invoice.count({ where: { organizationId } }),
    prisma.customer.count({ where: { organizationId } }),
    prisma.invoice.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    }),
    prisma.invoice.aggregate({
      where: { organizationId },
      _sum: { total: true }
    })
  ]);

  const totalRevenue = revenueResult._sum.total ?? 0;

  const stats = [
    { label: "Total Invoices", value: invoiceCount },
    { label: "Customers", value: customerCount },
    { label: "Total Billed", value: `₹${totalRevenue.toFixed(0)}` },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.name || user.email}</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">Recent Invoices</p>
          <Link href="/dashboard/invoices" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            View all →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Invoice</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Customer</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Amount</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                  No invoices yet.{' '}
                  <Link href="/dashboard/invoices/new" className="text-gray-700 underline underline-offset-2">Create one</Link>
                </td>
              </tr>
            ) : recentInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-gray-900 hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{inv.customer.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(inv.issueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">₹{inv.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{inv.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
