import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight,
  MoreHorizontal,
  Mail,
  Download
} from 'lucide-react';
import { InvoiceActions } from './InvoiceActions';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-secondary text-muted-foreground border-border",
  SENT: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PARTIALLY_PAID: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PAID: "bg-green-500/10 text-green-600 border-green-500/20",
  OVERDUE: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border opacity-60",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const invoices = await prisma.invoice.findMany({
    where: { 
      organizationId,
      AND: [
        q ? {
          OR: [
            { invoiceNumber: { contains: q, mode: 'insensitive' } },
            { customer: { name: { contains: q, mode: 'insensitive' } } },
          ]
        } : {},
        status ? { status: status as any } : {},
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { customer: true },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight heading-display">Invoices</h1>
          <p className="text-muted-foreground mt-1 tracking-tight">Manage and track your outgoing bills</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </Link>
      </div>

      {/* Toolbar */}
      <form method="GET" className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            name="q"
            defaultValue={q}
            placeholder="Search by invoice # or customer..." 
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            name="status"
            defaultValue={status}
            className="flex-1 md:flex-none bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <button type="submit" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all">
            Filter
          </button>
          <Link href="/dashboard/invoices" className="p-2.5 bg-secondary border border-border rounded-xl text-xs font-bold hover:bg-border transition-all">
            Reset
          </Link>
        </div>
      </form>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-left border-b border-border">
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Invoice</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Customer</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Issue Date</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Amount</th>
                <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">No invoices found</p>
                        <p className="text-xs text-muted-foreground">Try adjusting your filters or create a new invoice.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-secondary/30 transition-all group cursor-default">
                  <td className="px-6 py-5">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">#{inv.invoiceNumber}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary uppercase">
                        {inv.customer.name.slice(0, 2)}
                      </div>
                      <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{inv.customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-muted-foreground font-medium">{new Date(inv.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-bold text-foreground">₹{Number(inv.total).toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[inv.status] || STATUS_STYLES.DRAFT}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/dashboard/invoices/${inv.id}`}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      <InvoiceActions
                        invoiceId={inv.id}
                        invoiceNumber={inv.invoiceNumber}
                        invoiceStatus={inv.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">
        <p>{invoices.length} Invoices Recorded</p>
        <p>Sorted by Recent</p>
      </div>
    </div>
  );
}
