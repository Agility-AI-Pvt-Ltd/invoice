import { requireAuth } from '../../../../../lib/auth';
import { prisma } from '@repo/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Pencil, Plus, ArrowUpRight, Clock, CheckCircle2, AlertCircle, TrendingUp, FileText, ChevronRight 
} from 'lucide-react';
import InvoiceActions from './InvoiceActions';

const fmt = (n: number | any) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId },
    include: { customer: true, items: true, organization: true, payments: true },
  });

  if (!invoice) notFound();

  // Prioritize actual saved totals over state-code detection for the view/PDF
  const hasIgst = Number(invoice.igstTotal) > 0;
  const hasCgst = Number(invoice.cgstTotal) > 0;
  
  const orgState = (invoice.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const supplyState = (invoice.placeOfSupply || invoice.organization.stateCode || "").match(/\d+/)?.[0] || "";
  
  // If we have explicit tax values, use them. Otherwise, fall back to state-code detection.
  const isInterState = hasIgst ? true : hasCgst ? false : (!!orgState && !!supplyState && orgState !== supplyState);
  const totalPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Number(invoice.total) - totalPaid;
  const template = (invoice.organization as any).defaultTemplate || 'modern';

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-24 text-foreground">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/invoices" 
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all group"
          >
            <div className="p-2 bg-secondary/50 rounded-xl group-hover:bg-primary/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Invoices
          </Link>
          {(invoice.status === 'DRAFT' || invoice.status === 'SENT') && (
            <Link
              href={`/dashboard/invoices/${invoice.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-xs font-bold rounded-xl hover:bg-secondary/50 transition-all shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Invoice
            </Link>
          )}
        </div>
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status as any}
          total={Number(invoice.total)}
          paid={totalPaid}
          defaultTemplate={template}
        />
      </div>

      {/* Payment summary bar */}
      {totalPaid > 0 && (
        <div className={`rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          remaining <= 0 
            ? "bg-green-500/5 border-green-500/20" 
            : "bg-amber-500/5 border-amber-500/20"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              remaining <= 0 ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"
            }`}>
              {remaining <= 0 ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-widest ${remaining <= 0 ? "text-green-600" : "text-amber-600"}`}>
                {remaining <= 0 ? "Fully Paid" : "Partially Paid"}
              </p>
              <p className="text-muted-foreground text-xs font-medium">₹{totalPaid.toLocaleString('en-IN')} collected so far</p>
            </div>
          </div>
          {remaining > 0 && (
            <div className="bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/10">
              <span className="text-amber-700 text-sm font-bold">Balance Due: {fmt(remaining)}</span>
            </div>
          )}
        </div>
      )}

      {/* Invoice Document Canvas */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden min-h-[1000px] flex flex-col text-slate-900">
          
          {template === 'modern' && <ModernTemplate invoice={invoice} isInterState={isInterState} />}
          {template === 'classic' && <ClassicTemplate invoice={invoice} isInterState={isInterState} />}
          {template === 'minimal' && <MinimalTemplate invoice={invoice} isInterState={isInterState} />}

          {/* Payment History (Attached at bottom) */}
          {invoice.payments.length > 0 && (
            <div className="mt-auto px-12 py-10 bg-slate-50/50 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Payment History</h3>
              <div className="space-y-4">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group/pay">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-slate-400 font-medium">via {p.method || 'Bank Transfer'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-green-600">+ {fmt(p.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 opacity-40">
              <div className="w-4 h-4 bg-slate-900 rounded-[3px]" />
              <span className="text-[9px] font-bold uppercase tracking-widest italic">Invoicely Professional</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 italic">This is a computer generated invoice and does not require a signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TEMPLATE COMPONENTS ────────────────────────────────────────── */

function ModernTemplate({ invoice, isInterState }: any) {
  return (
    <>
      <div className="bg-[#111827] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase mb-4 text-white">{invoice.organization.name}</h2>
            <div className="space-y-1 opacity-70 text-xs font-medium">
              {invoice.organization.gstin && <p className="flex items-center gap-2"><span className="text-primary font-bold">GSTIN</span> {invoice.organization.gstin}</p>}
              {invoice.organization.address && <p className="max-w-xs">{invoice.organization.address}</p>}
              {invoice.organization.phone && <p>{invoice.organization.phone}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-5xl font-black tracking-tighter mb-2 italic opacity-20">INVOICE</h1>
            <p className="text-2xl font-bold text-primary">#{invoice.invoiceNumber}</p>
            <div className="mt-4 space-y-1 text-xs font-bold uppercase tracking-widest opacity-60">
              <p>Issue: {new Date(invoice.issueDate).toLocaleDateString('en-IN')}</p>
              <p className="text-primary/80">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-12 py-10 grid grid-cols-1 md:grid-cols-2 gap-12 bg-white">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Client Information</h3>
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-lg font-bold text-slate-900 mb-1">{invoice.customer.name}</p>
            <div className="space-y-1 text-xs text-slate-500 font-medium">
              {invoice.customer.gstin && <p>GSTIN: {invoice.customer.gstin}</p>}
              {invoice.customer.email && <p>{invoice.customer.email}</p>}
              <p className="mt-2 leading-relaxed italic text-slate-400 text-[10px] uppercase tracking-widest font-bold">Billing Address</p>
              <p className="leading-relaxed">{invoice.billingAddress || invoice.customer.address}</p>
              
              {invoice.shippingAddress && (
                <>
                  <p className="mt-4 leading-relaxed italic text-slate-400 text-[10px] uppercase tracking-widest font-bold">Shipping Address</p>
                  <p className="text-slate-900 font-bold">{invoice.shippingName || invoice.customer.name}</p>
                  <p className="leading-relaxed">{invoice.shippingAddress}</p>
                </>
              )}

              {invoice.customerDetails && (
                <p className="mt-4 p-3 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-500 italic">
                  {invoice.customerDetails}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Place of Supply</span>
            <span className="text-xs font-bold text-slate-700">{invoice.placeOfSupply}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxation Mode</span>
            <span className="text-xs font-bold text-primary italic">{isInterState ? 'IGST (Inter-state)' : 'CGST + SGST (Intra-state)'}</span>
          </div>
        </div>
      </div>

      <div className="px-12 py-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] border-b-2 border-slate-900/5">
              <th className="py-4 text-left font-black">Service / Product</th>
              <th className="py-4 text-center">Qty</th>
              <th className="py-4 text-right">Rate</th>
              <th className="py-4 text-center">GST%</th>
              <th className="py-4 text-right">Disc</th>
              <th className="py-4 text-right font-black">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoice.items.map((item: any) => (
              <tr key={item.id} className="group">
                <td className="py-6">
                  <p className="font-bold text-slate-800">{item.description}</p>
                  {item.hsnCode && <p className="text-[10px] text-slate-400 mt-1 font-mono">HSN: {item.hsnCode}</p>}
                </td>
                <td className="py-6 text-center font-medium">{item.quantity}</td>
                <td className="py-6 text-right font-medium">{fmt(item.unitPrice)}</td>
                <td className="py-6 text-center text-slate-400 text-[10px] font-bold">
                  {Number(item.taxRate)}%
                </td>
                <td className="py-6 text-right text-green-600 font-bold">
                  {Number(item.discount) > 0 ? `-${fmt(item.discount)}` : '-'}
                </td>
                <td className="py-6 text-right font-black text-slate-900">{fmt(Number(item.quantity) * Number(item.unitPrice) - Number(item.discount || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TaxBreakdownSection items={invoice.items} isInterState={isInterState} />

      <div className="px-12 py-10 flex justify-end">
        <div className="w-72 p-8 rounded-3xl bg-[#111827] text-white space-y-4 shadow-2xl">
          <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>{fmt(invoice.subTotal)}</span>
          </div>
          {isInterState ? (
            <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
              <span>IGST</span>
              <span>{fmt(invoice.igstTotal)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
                <span>CGST</span><span>{fmt(invoice.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold opacity-50 uppercase tracking-widest">
                <span>SGST</span><span>{fmt(invoice.sgstTotal)}</span>
              </div>
            </>
          )}
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between text-xs font-bold text-green-400 uppercase tracking-widest">
              <span>Discount</span>
              <span>-{fmt(invoice.discountTotal)}</span>
            </div>
          )}
          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Grand Total</span>
            <span className="text-3xl font-black italic">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ClassicTemplate({ invoice, isInterState }: any) {
  return (
    <div className="p-16 bg-white">
      <div className="border-b-2 border-slate-900 pb-12 mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 uppercase">{invoice.organization.name}</h1>
          <p className="text-sm font-bold text-slate-500 italic">Official Invoice</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
          <p className="text-4xl font-black text-slate-900 italic">#{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 mb-16 text-slate-900">
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">From</p>
            <p className="text-sm font-bold text-slate-800">{invoice.organization.name}</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">{invoice.organization.address}</p>
            {invoice.organization.gstin && <p className="text-xs font-bold text-slate-700 mt-2">GSTIN: {invoice.organization.gstin}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To</p>
            <p className="text-lg font-bold text-slate-900">{invoice.customer.name}</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">{invoice.billingAddress || invoice.customer.address}</p>
            
            {invoice.shippingAddress && (
              <div className="mt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ship To</p>
                <p className="text-sm font-bold text-slate-800">{invoice.shippingName || invoice.customer.name}</p>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">{invoice.shippingAddress}</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Date</span>
            <span className="text-sm font-bold text-slate-800">{new Date(invoice.issueDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</span>
            <span className="text-sm font-bold text-slate-800">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supply Region</span>
            <span className="text-sm font-bold text-slate-800">{invoice.placeOfSupply}</span>
          </div>
        </div>
      </div>

      <table className="w-full mb-12">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest">Description</th>
            <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Qty</th>
            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Unit Price</th>
            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Disc</th>
            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border-x border-slate-200 bg-white">
          {invoice.items.map((item: any) => (
            <tr key={item.id}>
              <td className="px-6 py-6">
                <p className="font-bold text-slate-800">{item.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-slate-400 italic">HSN: {item.hsnCode || 'N/A'}</p>
                  <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {Number(item.taxRate)}%
                  </span>
                </div>
              </td>
              <td className="px-6 py-6 text-center font-bold text-slate-600">{item.quantity}</td>
              <td className="px-6 py-6 text-right font-medium text-slate-600">{fmt(item.unitPrice)}</td>
              <td className="px-6 py-6 text-right text-green-600 font-bold">{Number(item.discount) > 0 ? `-${fmt(item.discount)}` : '-'}</td>
              <td className="px-6 py-6 text-right font-black text-slate-900">{fmt(Number(item.quantity) * Number(item.unitPrice) - Number(item.discount || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TaxBreakdownSection items={invoice.items} isInterState={isInterState} />


      <div className="flex justify-end">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
            <span>Subtotal</span><span>{fmt(invoice.subTotal)}</span>
          </div>
          {isInterState ? (
            <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
              <span>IGST</span><span>{fmt(invoice.igstTotal)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
                <span>CGST</span><span>{fmt(invoice.cgstTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-500 px-2">
                <span>SGST</span><span>{fmt(invoice.sgstTotal)}</span>
              </div>
            </>
          )}
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between text-xs font-bold text-green-600 px-2">
              <span>Discount</span>
              <span>-{fmt(invoice.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between bg-slate-900 text-white p-4 rounded-xl items-end mt-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Amount Due</span>
            <span className="text-3xl font-black italic">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalTemplate({ invoice, isInterState }: any) {
  return (
    <div className="p-20 relative bg-white min-h-[1000px]">
      <div className="absolute top-20 right-20 text-8xl font-black text-slate-50 uppercase tracking-tighter select-none pointer-events-none opacity-50 italic">
        INVOICE
      </div>
      
      <div className="relative z-10 mb-24">
        <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">{invoice.organization.name}</h1>
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 text-slate-900">
          <div className="space-y-1 text-xs font-medium text-slate-400 leading-relaxed">
            <p>{invoice.organization.address}</p>
            <p>{invoice.organization.phone}</p>
            {invoice.organization.gstin && <p className="font-bold text-slate-600 mt-2">GSTIN {invoice.organization.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-4xl font-black tracking-tighter text-slate-900 italic mb-2">#{invoice.invoiceNumber}</p>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest space-y-1">
              <p>Issued: {new Date(invoice.issueDate).toLocaleDateString('en-IN')}</p>
              <p className="text-slate-900">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-900">
        <div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Recipient (Billing)</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">{invoice.customer.name}</p>
          <div className="mt-4 text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            {invoice.billingAddress || invoice.customer.address}
            {invoice.customer.gstin && <p className="mt-2 font-bold text-slate-800">GSTIN {invoice.customer.gstin}</p>}
          </div>
        </div>
        {invoice.shippingAddress && (
          <div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4">Shipping Destination</p>
            <p className="text-xl font-bold text-slate-900 tracking-tight">{invoice.shippingName || invoice.customer.name}</p>
            <div className="mt-4 text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
              {invoice.shippingAddress}
            </div>
          </div>
        )}
      </div>

      <div className="mb-20 text-slate-900">
        <div className="grid grid-cols-12 pb-4 border-b border-slate-100 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          <div className="col-span-6">Details</div>
          <div className="col-span-1 text-center">Qty</div>
          <div className="col-span-2 text-right">Disc</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>
        {invoice.items.map((item: any) => (
          <div key={item.id} className="grid grid-cols-12 py-8 border-b border-slate-50 items-center">
            <div className="col-span-6">
              <p className="text-lg font-bold text-slate-900 tracking-tight">{item.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-slate-400 font-medium italic">Rate: {fmt(item.unitPrice)}</p>
                <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                  {Number(item.taxRate)}%
                </span>
              </div>
            </div>
            <div className="col-span-1 text-center font-bold text-slate-400">{item.quantity}</div>
            <div className="col-span-2 text-right text-green-600 font-bold">
              {Number(item.discount) > 0 ? `-${fmt(item.discount)}` : '-'}
            </div>
            <div className="col-span-3 text-right font-black text-xl text-slate-900 tracking-tighter italic">
              {fmt(Number(item.quantity) * Number(item.unitPrice) - Number(item.discount || 0))}
            </div>
          </div>
        ))}
      </div>
      <div className="mb-12">
        <TaxBreakdownSection items={invoice.items} isInterState={isInterState} />
      </div>


      <div className="flex flex-col items-end text-slate-900">
        <div className="w-full md:w-80 space-y-4">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Taxes</span>
            <span className="text-sm font-bold text-slate-600">{fmt(Number(invoice.total) - Number(invoice.subTotal))}</span>
          </div>
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between items-center px-4 py-2 bg-green-50 rounded-xl">
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Discount</span>
              <span className="text-sm font-bold text-green-600">-{fmt(invoice.discountTotal)}</span>
            </div>
          )}
          <div className="flex justify-between items-end px-4 py-6">
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">Amount Due</span>
            <span className="text-5xl font-black tracking-tighter text-slate-900 italic leading-none">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxBreakdownSection({ items, isInterState }: { items: any[]; isInterState: boolean }) {
  const summary = items.reduce((acc: any, item: any) => {
    const rate = Number(item.taxRate) || 0;
    const base = Number(item.quantity) * Number(item.unitPrice);
    const tax = (base * rate) / 100;
    if (!acc[rate]) acc[rate] = { rate, taxable: 0, tax: 0 };
    acc[rate].taxable += base;
    acc[rate].tax += tax;
    return acc;
  }, {});

  const rates = Object.values(summary).sort((a: any, b: any) => a.rate - b.rate);

  return (
    <div className="px-12 py-6 border-t border-slate-50 bg-slate-50/30">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tax Breakdown</h4>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-slate-400 font-bold uppercase tracking-wider">
            <th className="pb-3 text-left">GST Rate</th>
            <th className="pb-3 text-right">Taxable Value</th>
            {isInterState ? (
              <th className="pb-3 text-right">IGST</th>
            ) : (
              <>
                <th className="pb-3 text-right">CGST</th>
                <th className="pb-3 text-right">SGST</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rates.map((r: any, i: number) => (
            <tr key={i} className="text-slate-600 font-medium">
              <td className="py-2.5">{r.rate}%</td>
              <td className="py-2.5 text-right font-semibold text-slate-800">{fmt(r.taxable)}</td>
              {isInterState ? (
                <td className="py-2.5 text-right font-black text-slate-900">{fmt(r.tax)}</td>
              ) : (
                <>
                  <td className="py-2.5 text-right font-black text-slate-900">{fmt(r.tax / 2)}</td>
                  <td className="py-2.5 text-right font-black text-slate-900">{fmt(r.tax / 2)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

