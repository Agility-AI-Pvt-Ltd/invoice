import { requireAuth, getOrgOrThrow } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { InvoiceActions } from './InvoiceActions';
import { InvoiceAgingChart } from './_components/InvoiceAgingChart';
import { formatInr, toRupees } from '@/lib/money';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

const SORT_OPTIONS = {
  'date-desc': { issueDate: 'desc' as const },
  'date-asc': { issueDate: 'asc' as const },
  'price-desc': { total: 'desc' as const },
  'price-asc': { total: 'asc' as const },
};

type SortOption = keyof typeof SORT_OPTIONS;
const DEFAULT_SORT: SortOption = 'date-desc';

function parseFilterDateStart(date: string) {
  return new Date(`${date}T00:00:00.000+05:30`);
}

function parseFilterDateEnd(date: string) {
  return new Date(`${date}T23:59:59.999+05:30`);
}

function buildInvoicesQuery(params: {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  pageSize?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.status) search.set('status', params.status);
  if (params.dateFrom) search.set('dateFrom', params.dateFrom);
  if (params.dateTo) search.set('dateTo', params.dateTo);
  if (params.sort && params.sort !== DEFAULT_SORT) search.set('sort', params.sort);
  if (params.pageSize && params.pageSize !== String(DEFAULT_PAGE_SIZE)) search.set('pageSize', params.pageSize);
  if (params.page && params.page > 1) search.set('page', String(params.page));
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

function hasActiveFilters(params: { q?: string; status?: string; dateFrom?: string; dateTo?: string }) {
  return Boolean(params.q || params.status || params.dateFrom || params.dateTo);
}

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
  searchParams: Promise<{ q?: string; status?: string; page?: string; dateFrom?: string; dateTo?: string; sort?: string; pageSize?: string }>;
}) {
  const { q, status, page: pageParam, dateFrom, dateTo, sort: sortParam, pageSize: pageSizeParam } = await searchParams;
  const sort = (sortParam && sortParam in SORT_OPTIONS ? sortParam : DEFAULT_SORT) as SortOption;
  const showAll = pageSizeParam === 'all';
  const pageSize = showAll
    ? Number.MAX_SAFE_INTEGER
    : PAGE_SIZE_OPTIONS.includes(Number(pageSizeParam) as (typeof PAGE_SIZE_OPTIONS)[number])
      ? Number(pageSizeParam)
      : DEFAULT_PAGE_SIZE;
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const user = await requireAuth();
  const organizationId = getOrgOrThrow(user).id;
  const filtersActive = hasActiveFilters({ q, status, dateFrom, dateTo });

  const where = {
    organizationId,
    AND: [
      q ? {
        OR: [
          { invoiceNumber: { contains: q, mode: 'insensitive' as const } },
          { customer: { name: { contains: q, mode: 'insensitive' as const } } },
        ]
      } : {},
      status ? { status: status as any } : {},
      dateFrom || dateTo ? {
        issueDate: {
          ...(dateFrom ? { gte: parseFilterDateStart(dateFrom) } : {}),
          ...(dateTo ? { lte: parseFilterDateEnd(dateTo) } : {}),
        },
      } : {},
    ],
  };

  const [totalCount, totalUnfiltered] = await Promise.all([
    prisma.invoice.count({ where }),
    filtersActive
      ? prisma.invoice.count({ where: { organizationId } })
      : Promise.resolve(null),
  ]);

  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(currentPage, totalPages);

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: SORT_OPTIONS[sort],
    include: { customer: true },
    ...(showAll
      ? {}
      : {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
  });
  const showingFrom = totalCount === 0 ? 0 : showAll ? 1 : (page - 1) * pageSize + 1;
  const showingTo = showAll ? totalCount : Math.min(page * pageSize, totalCount);
  const queryBase = {
    q,
    status,
    dateFrom,
    dateTo,
    sort,
    pageSize: showAll ? 'all' : (pageSizeParam ?? String(DEFAULT_PAGE_SIZE)),
  };

  // ── Invoice Aging data ──
  const now = new Date();
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
    select: { dueDate: true, total: true },
  });

  const agingBuckets = [
    { label: 'Current (0–30d)', count: 0, amount: 0, color: '#10b981' },
    { label: 'Warning (31–60d)', count: 0, amount: 0, color: '#f59e0b' },
    { label: 'Critical (60d+)', count: 0, amount: 0, color: '#ef4444' },
  ];

  for (const inv of unpaidInvoices) {
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24)));
    const total = toRupees(inv.total);
    if (daysOverdue <= 30) {
      agingBuckets[0]!.count++;
      agingBuckets[0]!.amount += total;
    } else if (daysOverdue <= 60) {
      agingBuckets[1]!.count++;
      agingBuckets[1]!.amount += total;
    } else {
      agingBuckets[2]!.count++;
      agingBuckets[2]!.amount += total;
    }
  }


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

      {/* Invoice Aging Chart */}
      <InvoiceAgingChart buckets={agingBuckets} />

      {filtersActive && totalUnfiltered !== null && totalCount < totalUnfiltered && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-foreground">
            Showing <span className="font-bold">{totalCount}</span> filtered invoice{totalCount === 1 ? '' : 's'}.
            Your account has <span className="font-bold">{totalUnfiltered}</span> invoices in total.
          </p>
          <Link
            href={`/dashboard/invoices${buildInvoicesQuery({ sort, pageSize: pageSizeParam })}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Show all invoices
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <form method="GET" className="space-y-4">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            name="q"
            defaultValue={q}
            placeholder="Search by invoice # or customer..." 
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Status
            </label>
            <select 
              id="status"
              name="status"
              defaultValue={status}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dateFrom" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Issue Date From
            </label>
            <input
              id="dateFrom"
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="dateTo" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Issue Date To
            </label>
            <input
              id="dateTo"
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sort" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Sort By
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sort}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="pageSize" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
              Per Page
            </label>
            <select
              id="pageSize"
              name="pageSize"
              defaultValue={showAll ? 'all' : String(pageSize)}
              className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-all">
              Filter
            </button>
            <Link href="/dashboard/invoices" className="px-4 py-2.5 bg-secondary border border-border rounded-xl text-xs font-bold hover:bg-border transition-all">
              Reset
            </Link>
          </div>
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground group-hover:text-primary transition-colors">#{inv.invoiceNumber}</span>
                      {inv.isAnomaly && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20" title={inv.anomalyReason || "Anomaly detected"}>
                          Anomaly
                        </span>
                      )}
                    </div>
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
                    <span className="font-bold text-foreground">{formatInr(inv.total)}</span>
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
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {totalCount === 0
            ? 'No invoices found'
            : showAll
              ? `Showing all ${totalCount} invoice${totalCount === 1 ? '' : 's'}`
              : `Showing ${showingFrom}–${showingTo} of ${totalCount}`}
        </p>
        {!showAll && totalPages > 1 && (
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/dashboard/invoices${buildInvoicesQuery({ ...queryBase, page: page - 1 })}`}
                className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold hover:bg-secondary transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-bold text-muted-foreground/50 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                Previous
              </span>
            )}
            <span className="px-3 py-2 text-xs font-bold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/dashboard/invoices${buildInvoicesQuery({ ...queryBase, page: page + 1 })}`}
                className="flex items-center gap-1 px-3 py-2 bg-card border border-border rounded-xl text-xs font-bold hover:bg-secondary transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 px-3 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-bold text-muted-foreground/50 cursor-not-allowed">
                Next
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
