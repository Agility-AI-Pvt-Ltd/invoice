import { requireAuth } from '../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const [invoiceCount, customerCount, recentInvoices, revenueResult, pendingInvoices, paymentsResult] = await Promise.all([
    prisma.invoice.count({ where: { organizationId } }),
    prisma.customer.count({ where: { organizationId } }),
    prisma.invoice.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    }),
    prisma.payment.aggregate({
      where: { invoice: { organizationId } },
      _sum: { amount: true }
    }),
    prisma.invoice.aggregate({
      where: { 
        organizationId, 
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE', 'DRAFT'] } 
      },
      _sum: { total: true }
    }),
    prisma.payment.aggregate({
      where: { 
        invoice: { 
          organizationId, 
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE', 'DRAFT'] } 
        } 
      },
      _sum: { amount: true }
    })
  ]);

  const totalRevenue = Number(revenueResult._sum.amount ?? 0);
  const pendingRevenue = Number(pendingInvoices._sum.total ?? 0) - Number(paymentsResult._sum.amount ?? 0);

  const stats = [
    { 
      label: "Collected Revenue", 
      value: `₹${Number(totalRevenue).toLocaleString('en-IN')}`, 
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    { 
      label: "Pending Payments", 
      value: `₹${Number(pendingRevenue).toLocaleString('en-IN')}`, 
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    { 
      label: "Total Customers", 
      value: customerCount, 
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20"
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Hello {user.name || user.email.split('@')[0]}, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices/new"
            className="group flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className={`bg-card border ${s.border} p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-125`} />
            <s.icon className={`w-6 h-6 ${s.color} mb-5`} />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
            <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
              <FileText className="w-4 h-4 text-primary" />
              Recent Invoices
            </h2>
            <Link href="/dashboard/invoices" className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1.5 transition-all">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest text-left border-b border-border/50">
                  <th className="px-8 py-4 font-bold">Invoice</th>
                  <th className="px-8 py-4 font-bold">Customer</th>
                  <th className="px-8 py-4 font-bold">Amount</th>
                  <th className="px-8 py-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-muted-foreground italic">
                      No invoices found. Start by creating your first one!
                    </td>
                  </tr>
                ) : recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-8 py-5">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-bold text-foreground group-hover:text-primary transition-colors">
                        #{inv.invoiceNumber}
                      </Link>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-8 py-5 text-muted-foreground font-medium">{inv.customer.name}</td>
                    <td className="px-8 py-5 font-bold text-foreground">₹{Number(inv.total).toLocaleString('en-IN')}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        inv.status === 'PAID' ? 'bg-green-500/10 text-green-600' : 
                        inv.status === 'SENT' ? 'bg-blue-500/10 text-blue-600' : 
                        'bg-muted text-muted-foreground/70'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Insights / Help Card */}
        <div className="space-y-6">
          <div className="bg-primary p-7 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-24 h-24 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2 heading-display text-primary-foreground">Grow your business</h3>
            <p className="text-primary-foreground/80 text-sm mb-6 leading-relaxed">
              Connect Razorpay to automate your payment tracking and reduce collection time by 40%.
            </p>
            <Link 
              href="/dashboard/settings" 
              className="inline-flex items-center gap-2 text-xs font-bold bg-primary-foreground text-primary px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              Setup Payments
            </Link>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Upcoming Tasks
            </h3>
            <div className="space-y-4">
               {invoiceCount === 0 ? (
                 <p className="text-xs text-muted-foreground">Everything looks clear!</p>
               ) : (
                 <div className="flex items-start gap-3">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                   <div>
                     <p className="text-xs font-semibold">Follow up on pending invoices</p>
                     <p className="text-[10px] text-muted-foreground mt-0.5">You have {invoiceCount} invoices awaiting payment.</p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
