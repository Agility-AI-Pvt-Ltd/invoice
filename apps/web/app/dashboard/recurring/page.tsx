import { requireAuth } from '../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { Plus, Repeat, FileText } from 'lucide-react';

export default async function RecurringInvoicesPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const recurringInvoices = await prisma.recurringInvoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1>
          <p className="text-gray-500">Automate your billing with scheduled invoices.</p>
        </div>
        <Link 
          href="/dashboard/recurring/new" 
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Interval</th>
                <th className="px-6 py-4 font-semibold">Next Issue Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recurringInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Repeat className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-1">No recurring invoices</p>
                      <p className="text-sm text-gray-500 mb-4">Set up an automated billing schedule for your retainers.</p>
                      <Link 
                        href="/dashboard/recurring/new" 
                        className="text-primary font-medium hover:text-primary-dark"
                      >
                        Create Schedule →
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringInvoices.map((recurring) => (
                  <tr key={recurring.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{recurring.customer.name}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{recurring.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Repeat className="w-3 h-3 text-gray-400" />
                        {recurring.interval}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(recurring.nextIssueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {recurring.active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:text-primary-dark font-medium text-sm">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
