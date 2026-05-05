import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import Link from 'next/link';
import { Plus, Search, Box, Filter, Download, MoreHorizontal, TrendingUp } from 'lucide-react';

export default async function ProductsPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  const products = await prisma.product.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight heading-display text-foreground">Inventory</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Manage your catalog, pricing, and HSN codes.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            placeholder="Search catalog by name or HSN..." 
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold hover:bg-secondary transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-bold hover:bg-secondary transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground border-b border-border">
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Product / Service</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">HSN/SAC</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Unit Price</th>
                <th className="px-8 py-4 font-bold uppercase tracking-widest text-[10px]">Tax Rate</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-secondary/50 rounded-3xl flex items-center justify-center mb-2">
                        <Box className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-bold text-foreground">No items in catalog</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">Add your products or services to speed up your invoicing process.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                          <Box className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Asset ID: {p.id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded-md border border-border/50">
                        {p.hsnCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-bold text-foreground">
                      ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-primary">{p.taxRate}% GST</span>
                      </div>
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
        <p>{products.length} Items in Catalog</p>
        <p>Sorted by Recent</p>
      </div>
    </div>
  );
}
