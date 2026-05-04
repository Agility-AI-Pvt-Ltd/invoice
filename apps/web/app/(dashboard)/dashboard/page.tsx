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

  const [invoiceCount, customerCount, recentInvoices, revenueResult, pendingResult] = await Promise.all([
    prisma.invoice.count({ where: { organizationId } }),
    prisma.customer.count({ where: { organizationId } }),
    prisma.invoice.findMany({
      where: { organizationId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: 'PAID' },
      _sum: { total: true }
    }),
    prisma.invoice.aggregate({
      where: { organizationId, status: { in: ['SENT', 'PARTIALLY_PAID'] } },
      _sum: { total: true }
    })
  ]);

  const totalRevenue = revenueResult._sum.total ?? 0;
  const pendingRevenue = pendingResult._sum.total ?? 0;

  const stats = [
    { 
      label: "Collected Revenue", 
      value: `₹${totalRevenue.toLocaleString('en-IN')}`, 
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10"
    },
    { 
      label: "Pending Payments", 
      value: `₹${pendingRevenue.toLocaleString('en-IN')}`, 
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10"
    },
    { 
      label: "Total Customers", 
      value: customerCount, 
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10"
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight heading-display">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Hello {user.name || user.email.split('@')[0]}, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110`} />
            <s.icon className={`w-5 h-5 ${s.color} mb-4`} />
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
            <h2 className="font-bold heading-display flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Invoices
            </h2>
            <Link href="/dashboard/invoices" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left border-b border-border">
                  <th className="px-6 py-4 font-medium">Invoice</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No invoices found. Start by creating one.
                    </td>
                  </tr>
                ) : recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                        #{inv.invoiceNumber}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(inv.issueDate).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">{inv.customer.name}</td>
                    <td className="px-6 py-4 font-bold">₹{inv.total.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'PAID' ? 'bg-green-500/10 text-green-600' : 
                        inv.status === 'SENT' ? 'bg-blue-500/10 text-blue-600' : 
                        'bg-muted text-muted-foreground'
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
          <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-bold mb-2 heading-display text-white">Grow your business</h3>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              Connect Razorpay to automate your payment tracking and reduce collection time by 40%.
            </p>
            <Link 
              href="/dashboard/settings" 
              className="inline-flex items-center gap-2 text-xs font-bold bg-white text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all"
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
