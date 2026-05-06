import React from 'react';
import { requireAuth } from '../../../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { Repeat, Calendar, FileText, AlertCircle, CheckCircle2, Pause, Play, Zap, Trash2, ArrowRight } from 'lucide-react';

export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const recurring = await prisma.recurringInvoice.findFirst({
    where: { id, organizationId },
    include: {
      customer: true,
      items: true,
      generatedInvoices: {
        select: { id: true, invoiceNumber: true, issueDate: true, total: true, status: true },
        orderBy: { issueDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!recurring) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Not found</h1>
          <p className="text-muted-foreground mt-2">This recurring invoice schedule does not exist.</p>
          <Link href="/dashboard/recurring" className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
            Back to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">
              {recurring.title || recurring.customer.name}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              recurring.active
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-muted text-muted-foreground border border-border'
            }`}>
              {recurring.active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Subscription ID: {recurring.id.slice(0, 8)}</p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/recurring/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-secondary transition-all font-bold text-sm"
          >
            Edit
          </Link>
          <ToggleButton id={id} active={recurring.active} />
          <ManualRunButton id={id} />
        </div>
      </div>

      {/* Schedule Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Subscriber</p>
          <p className="font-bold text-foreground">{recurring.customer.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{recurring.customer.email || 'No email'}</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Frequency</p>
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            <span className="font-bold text-foreground">{recurring.interval}</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Invoice</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-foreground">
              {new Date(recurring.nextIssueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Cycle Amount</p>
          <p className="text-2xl font-black text-foreground">₹{Number(recurring.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Due Days</p>
          <p className="font-bold text-foreground">{recurring.dueDays} days</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Auto-Send</p>
          <p className="font-bold text-foreground">{recurring.autoSend ? 'Enabled' : 'Disabled'}</p>
        </div>

        {recurring.endDate && (
          <div className="bg-card border border-border p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">End Date</p>
            <p className="font-bold text-foreground">
              {new Date(recurring.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground border-b border-border">
                <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Description</th>
                <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Qty</th>
                <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Price</th>
                <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Tax</th>
                <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {recurring.items.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/20 transition-all">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-foreground">{item.description}</p>
                      {item.hsnCode && <p className="text-xs text-muted-foreground">HSN: {item.hsnCode}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">₹{Number(item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right">₹{(Number(item.cgstAmount) + Number(item.sgstAmount) + Number(item.igstAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right font-bold">₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Invoices */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Generated Invoices</h2>
        </div>
        {recurring.generatedInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No invoices generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Invoice #</th>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Date</th>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recurring.generatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-all">
                    <td className="px-6 py-4 font-semibold text-foreground">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      {new Date(inv.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold">₹{Number(inv.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-green-500/10 text-green-600'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-primary hover:text-primary/80 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <div className="flex justify-end">
        <DeleteButton id={id} />
      </div>
    </div>
  );
}

// Toggle Button Component
function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recurring/${id}/toggle`, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl hover:bg-secondary transition-all font-bold text-sm disabled:opacity-50"
    >
      {active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {active ? 'Pause' : 'Resume'}
    </button>
  );
}

// Manual Run Button Component
function ManualRunButton({ id }: { id: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recurring/${id}/run`, { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all font-bold text-sm disabled:opacity-50"
    >
      <Zap className="w-4 h-4" />
      Generate Now
    </button>
  );
}

// Delete Button Component
function DeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this subscription schedule?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/dashboard/recurring';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-destructive/20 text-destructive rounded-xl hover:bg-destructive/5 transition-all font-bold text-sm disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      Delete
    </button>
  );
}
