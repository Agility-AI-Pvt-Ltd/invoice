'use client';

import { useState } from 'react';
import { Download, FileText, Loader2, TrendingUp } from 'lucide-react';

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

  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Reports & GST</h1>
        <p className="text-sm text-gray-500">Generate GSTR-1 and revenue reports for filing and analysis</p>
      </div>

      {/* GSTR-1 Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">GSTR-1 Export</h2>
            <p className="text-xs text-gray-500">B2B & B2C outward supplies — share with your CA for GST filing</p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-end gap-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => { setMonth(e.target.value); setPreview(null); }}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <button
              onClick={fetchPreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={downloadCsv}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}

          {preview && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Invoices', value: preview.summary.total_invoices },
                  { label: 'Taxable Value', value: fmt(preview.summary.total_taxable_value) },
                  { label: 'Total GST', value: fmt(preview.summary.total_cgst + preview.summary.total_sgst + preview.summary.total_igst) },
                  { label: 'Invoice Value', value: fmt(preview.summary.total_invoice_value) },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* B2B */}
              {preview.b2b.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    B2B — Registered Buyers ({preview.b2b.length})
                  </p>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Invoice</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Buyer</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">GSTIN</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Taxable</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">GST</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {preview.b2b.map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-gray-900">{row.invoice_number}</td>
                            <td className="px-3 py-2 text-gray-700">{row.receiver_name}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono">{row.receiver_gstin}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{fmt(row.taxable_value)}</td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {row.igst > 0 ? fmt(row.igst) : `${fmt(row.cgst)} + ${fmt(row.sgst)}`}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.invoice_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* B2C */}
              {preview.b2c.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    B2C — Unregistered Buyers ({preview.b2c.length})
                  </p>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Invoice</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Buyer</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Supply Type</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Taxable</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">GST</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {preview.b2c.map((row: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium text-gray-900">{row.invoice_number}</td>
                            <td className="px-3 py-2 text-gray-700">{row.receiver_name}</td>
                            <td className="px-3 py-2 text-gray-500">{row.supply_type}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{fmt(row.taxable_value)}</td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {row.igst > 0 ? fmt(row.igst) : `${fmt(row.cgst)} + ${fmt(row.sgst)}`}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.invoice_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.b2b.length === 0 && preview.b2c.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No invoices found for {month}. Only non-draft, non-cancelled invoices appear here.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
