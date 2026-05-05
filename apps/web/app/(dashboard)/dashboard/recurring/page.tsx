import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { Plus, Repeat, FileText, Calendar, Clock, MoreHorizontal, ArrowRight, Zap } from 'lucide-react';

export default async function RecurringInvoicesPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const recurringInvoices = await prisma.recurringInvoice.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Automate your billing with scheduled, high-performance recurring invoices.</p>
        </div>
        <Link 
          href="/dashboard/recurring/new" 
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Schedule
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Cycles</p>
          <p className="text-3xl font-black text-foreground">{recurringInvoices.filter(r => r.active).length}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Next 30 Days</p>
          <p className="text-3xl font-black text-foreground">
            {recurringInvoices.filter(r => {
              const next = new Date(r.nextIssueDate);
              const thirtyDays = new Date();
              thirtyDays.setDate(thirtyDays.getDate() + 30);
              return next <= thirtyDays;
            }).length}
          </p>
        </div>
        <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm relative overflow-hidden group text-primary">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Total ARR Value</p>
          <p className="text-3xl font-black">₹{recurringInvoices.reduce((acc, r) => acc + (Number(r.total) * (r.interval === 'MONTHLY' ? 12 : r.interval === 'WEEKLY' ? 52 : 1)), 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground border-b border-border">
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Subscriber</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Cycle Amount</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Frequency</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Upcoming Date</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Status</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recurringInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-secondary/50 rounded-3xl flex items-center justify-center mb-2">
                        <Repeat className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-bold text-foreground">No automation schedules</p>
                      <p className="text-xs text-muted-foreground max-w-[250px]">Create an automated billing schedule for your retainer clients or subscriptions.</p>
                      <Link 
                        href="/dashboard/recurring/new" 
                        className="mt-4 flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest hover:opacity-80 transition-all"
                      >
                        Start Automating <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringInvoices.map((recurring) => (
                  <tr key={recurring.id} className="hover:bg-secondary/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary uppercase">
                          {recurring.customer.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{recurring.customer.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Retainer ID: {recurring.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-foreground">
                      ₹{Number(recurring.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-lg text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50">
                        <Repeat className="w-3 h-3" />
                        {recurring.interval}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/50" />
                        {new Date(recurring.nextIssueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      {recurring.active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-border">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">
        <p>{recurringInvoices.length} Subscription Schedules</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> {recurringInvoices.filter(r => r.active).length} Running</span>
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {recurringInvoices.filter(r => !r.active).length} Paused</span>
        </div>
      </div>
    </div>
  );
}
