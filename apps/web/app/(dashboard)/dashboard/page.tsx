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
  AlertCircle,
  ArrowDownRight,
  DollarSign,
  Flame,
} from 'lucide-react';
import { DashboardCharts } from './_components/DashboardCharts';
import { computeExpenseSummary } from '@/lib/expenses/summary';
import { amountsToBreakdownRows } from '@/lib/expenses/breakdown';
import { formatInr as formatInvoiceInr, toRupees } from '@/lib/money';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENT: '#3b82f6',
  PARTIALLY_PAID: '#f59e0b',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
  CANCELLED: '#6b7280',
};

/** Expenses are always stored in paise. */
function formatExpenseInr(cents: number) {
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function trendLine(pct: number | null, invertGood?: boolean): { text?: string; trendUp?: boolean } {
  if (pct === null) return {};
  const arrow = pct >= 0 ? '↑' : '↓';
  const text = `${arrow} ${Math.abs(pct)}% vs last month`;
  const up = invertGood ? pct <= 0 : pct >= 0;
  return { text, trendUp: up };
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  // ── Core queries ──
  const [invoiceCount, customerCount, recentInvoices, revenueResult, pendingInvoices, paymentsResult, expenseSummary] = await Promise.all([
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
    }),
    organizationId ? computeExpenseSummary(organizationId) : null,
  ]);

  // ── Chart data queries ──
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [allInvoices, statusGroups, topCustomerRows] = await Promise.all([
    // Monthly revenue: sum of all non-cancelled invoice totals in last 6 months
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: { not: 'CANCELLED' },
        issueDate: { gte: sixMonthsAgo },
      },
      select: { issueDate: true, total: true },
    }),
    // Invoice status breakdown
    prisma.invoice.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true },
    }),
    // Top 5 customers by paid invoice value
    prisma.invoice.groupBy({
      by: ['customerId'],
      where: { organizationId, status: 'PAID' },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  // Aggregate invoices into monthly buckets
  const monthBuckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    monthBuckets.set(key, 0);
  }
  for (const inv of allInvoices) {
    const d = new Date(inv.issueDate);
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, (monthBuckets.get(key) ?? 0) + toRupees(inv.total));
    }
  }
  const revenueData = Array.from(monthBuckets, ([month, revenue]) => ({
    month,
    revenue,
  }));

  // Invoice status data
  const statusData = (['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((status) => {
    const group = statusGroups.find((g) => g.status === status);
    return { status, count: group?._count._all ?? 0, color: STATUS_COLORS[status] ?? '#94a3b8' };
  }).filter((d) => d.count > 0);

  // Top customers — resolve names
  const customerIds = topCustomerRows.map((r) => r.customerId);
  const customerNames = customerIds.length > 0
    ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameMap = new Map(customerNames.map((c) => [c.id, c.name]));
  const topCustomers = topCustomerRows.map((r) => ({
    name: nameMap.get(r.customerId) ?? 'Unknown',
    revenue: toRupees(r._sum.total ?? 0),
  }));

  // Total Revenue based on all non-cancelled invoices
  const totalRevenueResult = await prisma.invoice.aggregate({
    where: { 
      organizationId,
      status: { not: 'CANCELLED' }
    },
    _sum: { total: true }
  });
  const totalRevenue = Number(totalRevenueResult._sum.total ?? 0);
  const pendingRevenue = Number(pendingInvoices._sum.total ?? 0) - Number(paymentsResult._sum.amount ?? 0);

  // Expense summary data
  const expIncome = expenseSummary?.currentMonth.income ?? 0;
  const expExpenses = expenseSummary?.currentMonth.expenses ?? 0;
  const expNet = expenseSummary?.currentMonth.net ?? 0;
  const burnPerDay = expenseSummary?.burnPerDay ?? 0;
  const incomeTrend = trendLine(expenseSummary?.trends.incomePct ?? null, false);
  const expenseTrend = trendLine(expenseSummary?.trends.expensePct ?? null, true);
  const netTrend = trendLine(expenseSummary?.trends.netPct ?? null, false);

  const expenseChartData = (expenseSummary?.chartMonths ?? []).map((m) => ({
    month: m.label,
    income: m.income,
    expenses: m.expenses,
  }));

  const breakdownRows = amountsToBreakdownRows(expenseSummary?.expenseBreakdown ?? []);

  const invoiceStats = [
    { 
      label: "Total Revenue", 
      value: formatInvoiceInr(totalRevenue), 
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    { 
      label: "Pending Payments", 
      value: formatInvoiceInr(pendingRevenue), 
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

      {/* ── Financial Health (Business Expenses) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Financial Health · This Month</p>
          <Link href="/dashboard/expenses" className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1 transition-all">
            View Details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="bg-card border border-green-500/20 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-125" />
            <ArrowUpRight className="w-5 h-5 text-green-600 mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Income</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">{formatExpenseInr(expIncome)}</p>
            {incomeTrend.text && (
              <p className={`text-[10px] font-semibold mt-1.5 ${incomeTrend.trendUp ? 'text-green-600' : 'text-orange-500'}`}>
                {incomeTrend.text}
              </p>
            )}
          </div>
          {/* Total Expenses */}
          <div className="bg-card border border-orange-500/20 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-125" />
            <ArrowDownRight className="w-5 h-5 text-orange-500 mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Expenses</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">{formatExpenseInr(expExpenses)}</p>
            {expenseTrend.text && (
              <p className={`text-[10px] font-semibold mt-1.5 ${expenseTrend.trendUp ? 'text-green-600' : 'text-orange-500'}`}>
                {expenseTrend.text}
              </p>
            )}
          </div>
          {/* Net Profit */}
          <div className="bg-card border border-primary/20 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-125" />
            <DollarSign className="w-5 h-5 text-primary mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Net Profit</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">{formatExpenseInr(expNet)}</p>
            {netTrend.text && (
              <p className={`text-[10px] font-semibold mt-1.5 ${netTrend.trendUp ? 'text-green-600' : 'text-orange-500'}`}>
                {netTrend.text}
              </p>
            )}
          </div>
          {/* Monthly Burn */}
          <div className="bg-card border border-rose-500/20 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-125" />
            <Flame className="w-5 h-5 text-rose-500 mb-4" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monthly Burn</p>
            <p className="text-2xl font-bold mt-1 tracking-tight text-foreground">{formatExpenseInr(burnPerDay)}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5">avg. expense per day this month</p>
          </div>
        </div>
      </div>

      {/* ── Income vs Expenses + Expense Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 bg-card border border-border rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
            <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              Income vs Expenses
            </h2>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Last 6 Months
            </span>
          </div>
          <div className="p-6">
            <IncomeVsExpensesChartWrapper data={expenseChartData} />
          </div>
        </section>

        <section className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
            <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
              <DollarSign className="w-4 h-4 text-orange-500" />
              Expense Breakdown
            </h2>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              This Month
            </span>
          </div>
          <div className="p-6">
            {breakdownRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No expense entries this month.</p>
            ) : (
              <ExpenseBreakdownWrapper rows={breakdownRows} />
            )}
          </div>
        </section>
      </div>

      {/* ── Invoice Stats ── */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Invoice Overview</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {invoiceStats.map((s) => (
            <div key={s.label} className={`bg-card border ${s.border} p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group`}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${s.bg} rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-125`} />
              <s.icon className={`w-6 h-6 ${s.color} mb-5`} />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-bold mt-1 tracking-tight text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Analytics Charts */}
      <DashboardCharts
        revenueData={revenueData}
        statusData={statusData}
        topCustomers={topCustomers}
      />

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
                    <td className="px-8 py-5 font-bold text-foreground">{formatInvoiceInr(inv.total)}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        inv.status === 'PAID' ? 'bg-green-500/10 text-green-600' : 
                        inv.status === 'SENT' ? 'bg-blue-500/10 text-blue-600' : 
                        inv.status === 'DRAFT' ? 'bg-slate-500/10 text-slate-500' :
                        inv.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500' :
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

// ── Inline server-side wrappers for client components ──
import { IncomeExpenseChart } from './expenses/_components/IncomeExpenseChart';
import { ExpenseBreakdownList } from './expenses/_components/ExpenseBreakdownList';
import type { BreakdownRow } from '@/lib/expenses/breakdown';

function IncomeVsExpensesChartWrapper({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  return <IncomeExpenseChart data={data} />;
}

function ExpenseBreakdownWrapper({ rows }: { rows: BreakdownRow[] }) {
  return <ExpenseBreakdownList rows={rows} />;
}
