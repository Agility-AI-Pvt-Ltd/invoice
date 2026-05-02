import { requireAuth } from '../../../lib/auth';
import { prisma } from '@repo/db';
import { Users } from 'lucide-react';
import CustomerModal from './CustomerModal';

export default async function CustomersPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} total</p>
        </div>
        <CustomerModal />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">GSTIN</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">State</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">GST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No customers yet. Add your first one.</p>
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.gstin || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.stateCode || '—'}</td>
                  <td className="px-4 py-3">
                    {c.isRegistered
                      ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Registered</span>
                      : <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Unregistered</span>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
