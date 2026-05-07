import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import type { Customer } from '@prisma/client';
import Link from 'next/link';
import { Users, UserPlus, Search, Filter, Download, MoreHorizontal, Pencil } from 'lucide-react';
import CustomerModal from './CustomerModal';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const customers: Customer[] = await prisma.customer.findMany({
    where: { 
      organizationId,
      OR: q ? [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { gstin: { contains: q, mode: 'insensitive' } },
      ] : undefined
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Manage your client directory and tax profiles.</p>
        </div>
        <CustomerModal />
      </div>

      {/* Toolbar */}
      <form method="GET" className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            name="q"
            defaultValue={q}
            placeholder="Search customers by name, email or GSTIN..." 
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button type="submit" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-md">
            Search
          </button>
          <Link href="/dashboard/customers" className="p-2.5 bg-secondary border border-border rounded-xl text-xs font-bold hover:bg-border transition-all">
            Reset
          </Link>
        </div>
      </form>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-left border-b border-border">
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Client Name</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Contact Info</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Tax Identifier</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Region</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Status</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-secondary/50 rounded-3xl flex items-center justify-center mb-2">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-bold text-foreground">No customers found</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">Try adjusting your search or add a new customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary uppercase">
                          {c.name.slice(0, 2)}
                        </div>
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-muted-foreground font-medium">{c.email || '—'}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                        {c.gstin || 'No GSTIN'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-foreground">{c.stateCode || '—'}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {c.isRegistered
                        ? <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20">Registered</span>
                        : <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-border">Unregistered</span>
                      }
                    </td>
                    <td className="px-8 py-6 text-right">
                      <CustomerModal 
                        customer={c}
                        trigger={
                          <button className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-primary flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary Stats Footer */}
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">
        <p>{customers.length} Clients Record</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {customers.filter(c => c.isRegistered).length} GST Reg.</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {customers.filter(c => !c.isRegistered).length} Unreg.</span>
        </div>
      </div>
    </div>
  );
}
