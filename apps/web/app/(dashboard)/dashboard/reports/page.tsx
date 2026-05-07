'use client';

import { useState } from 'react';
import { 
  Download, FileText, Loader2, TrendingUp, Calendar, 
  BarChart3, PieChart, ArrowUpRight, CheckCircle2, AlertCircle 
} from 'lucide-react';

export default function ReportsPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/gstr1?month=${month}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    window.open(`/api/reports/gstr1?month=${month}&format=csv`, '_blank');
  };

  const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Tax Reports</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Generate GSTR-1 and revenue reports for filing and analysis.</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border p-1.5 rounded-2xl shadow-sm">
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPreview(null); }}
            className="bg-transparent border-none text-sm font-bold text-foreground focus:ring-0 px-3 py-1.5 outline-none cursor-pointer"
          />
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Generate Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/20 flex items-center gap-2 animate-in shake">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Main Report Card */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5 relative group">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
        
        <div className="p-8 md:p-12">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-green-500/10 rounded-[1.25rem] flex items-center justify-center text-green-600">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground heading-display">GSTR-1 Monthly Export</h2>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">B2B & B2C Outward Supplies · {new Date(month + "-01").toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <button
                onClick={downloadCsv}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-foreground text-background text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-foreground/10 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download GSTR-1 CSV
              </button>
           </div>

           {preview ? (
             <div className="space-y-12">
                {/* Visual Summary Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Invoices', value: preview.summary.total_invoices, icon: <BarChart3 className="w-4 h-4" /> },
                    { label: 'Taxable Value', value: fmt(preview.summary.total_taxable_value), icon: <TrendingUp className="w-4 h-4" /> },
                    { label: 'Total GST', value: fmt(preview.summary.total_cgst + preview.summary.total_sgst + preview.summary.total_igst), icon: <PieChart className="w-4 h-4" /> },
                    { label: 'Invoice Value', value: fmt(preview.summary.total_invoice_value), icon: <CheckCircle2 className="w-4 h-4" /> },
                  ].map((s) => (
                    <div key={s.label} className="bg-secondary/20 rounded-[2rem] p-6 border border-border/50 hover:border-primary/20 transition-all group/tile">
                      <div className="flex items-center justify-between mb-4">
                         <div className="p-2 bg-background rounded-xl border border-border group-hover/tile:text-primary transition-colors">
                           {s.icon}
                         </div>
                         <ArrowUpRight className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-lg font-black text-foreground">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* B2B Table */}
                {preview.b2b.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">B2B — Registered Buyers ({preview.b2b.length})</h3>
                       <div className="h-px bg-border flex-1 mx-6" />
                    </div>
                    <div className="border border-border rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border text-muted-foreground text-left">
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Invoice</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Buyer</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">GSTIN</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">Taxable</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">GST</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {preview.b2b.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-secondary/10 transition-colors">
                              <td className="px-6 py-4 font-bold text-foreground">#{row.invoice_number}</td>
                              <td className="px-6 py-4 text-muted-foreground font-medium">{row.receiver_name}</td>
                              <td className="px-6 py-4 font-mono font-bold text-primary/80">{row.receiver_gstin}</td>
                              <td className="px-6 py-4 text-right font-medium text-foreground">{fmt(row.taxable_value)}</td>
                              <td className="px-6 py-4 text-right text-muted-foreground font-bold">
                                {row.igst > 0 ? fmt(row.igst) : `${fmt(row.cgst)} + ${fmt(row.sgst)}`}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-foreground">{fmt(row.invoice_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* B2C Table */}
                {preview.b2c.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">B2C — Unregistered Buyers ({preview.b2c.length})</h3>
                       <div className="h-px bg-border flex-1 mx-6" />
                    </div>
                    <div className="border border-border rounded-3xl overflow-hidden shadow-sm">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/30 border-b border-border text-muted-foreground text-left">
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Invoice</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Buyer</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[9px]">Supply Type</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">Taxable</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">GST</th>
                            <th className="px-6 py-4 text-right font-bold uppercase tracking-widest text-[9px]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {preview.b2c.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-secondary/10 transition-colors">
                              <td className="px-6 py-4 font-bold text-foreground">#{row.invoice_number}</td>
                              <td className="px-6 py-4 text-muted-foreground font-medium">{row.receiver_name}</td>
                              <td className="px-6 py-4 text-muted-foreground italic">{row.supply_type}</td>
                              <td className="px-6 py-4 text-right font-medium text-foreground">{fmt(row.taxable_value)}</td>
                              <td className="px-6 py-4 text-right text-muted-foreground font-bold">
                                {row.igst > 0 ? fmt(row.igst) : `${fmt(row.cgst)} + ${fmt(row.sgst)}`}
                              </td>
                              <td className="px-6 py-4 text-right font-black text-foreground">{fmt(row.invoice_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {preview.b2b.length === 0 && preview.b2c.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 rounded-[2rem] border border-dashed border-border">
                    <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-sm font-bold text-foreground">No transaction data found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[250px] text-center leading-relaxed">No non-draft, non-cancelled invoices recorded for the selected month.</p>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Ready to analyze?</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">Select a month and click generate to preview your GST compliance data and revenue summary.</p>
             </div>
           )}
        </div>
      </div>
      
      {/* Footer Disclaimer */}
      <div className="px-6 py-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
         <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
         <p className="text-[10px] text-amber-700/80 leading-relaxed font-medium">
            <span className="font-bold text-amber-700 uppercase tracking-widest block mb-1">Disclaimer</span>
            This report is generated based on your recorded invoices in Invoicely. Please verify the values with your actual bank statements and accounting software before final filing. Invoicely is not responsible for any inaccuracies in tax filing.
         </p>
      </div>
    </div>
  );
}
