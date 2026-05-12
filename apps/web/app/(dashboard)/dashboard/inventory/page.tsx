import { requireAuth } from "@/lib/auth";
import { prisma } from "@repo/db";
import Link from "next/link";
import { Warehouse, Settings, Package } from "lucide-react";

export default async function InventoryPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { inventoryTrackingEnabled: true },
  });

  const rows =
    org?.inventoryTrackingEnabled === true
      ? await prisma.inventoryItem.findMany({
          where: { warehouse: { organizationId } },
          include: {
            product: { select: { id: true, name: true, sku: true, productKind: true } },
            warehouse: { select: { id: true, name: true, isDefault: true } },
          },
          orderBy: [{ product: { name: "asc" } }],
        })
      : [];

  const lowStock = rows.filter((r) => {
    const rp = r.reorderPoint;
    if (rp == null) return false;
    return r.quantityOnHand.lte(rp);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            On-hand stock by warehouse (default warehouse is created automatically).
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Settings className="w-4 h-4" />
          Tracking settings
        </Link>
      </div>

      {!org?.inventoryTrackingEnabled ? (
        <div className="rounded-2xl border border-amber-600/40 bg-amber-50 px-5 py-4 text-sm text-amber-950 shadow-sm dark:border-amber-400/45 dark:bg-amber-950/75 dark:text-amber-50 dark:shadow-none">
          Inventory tracking is off. Enable{" "}
          <span className="font-semibold text-amber-900 dark:text-amber-100">
            Track inventory (stock)
          </span>{" "}
          under{" "}
          <Link
            href="/dashboard/settings"
            className="font-semibold text-primary underline decoration-primary/60 underline-offset-2 hover:decoration-primary dark:text-primary dark:decoration-primary/70"
          >
            Settings → Business
          </Link>{" "}
          to record deductions when payments are recorded (partial or full).
        </div>
      ) : lowStock.length > 0 ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm">
          <p className="font-semibold text-destructive flex items-center gap-2">
            <Package className="w-4 h-4" />
            {lowStock.length} SKU{lowStock.length === 1 ? "" : "s"} at or below reorder point
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Review rows highlighted below and adjust stock or reorder points.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Stock levels</p>
        </div>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            {org?.inventoryTrackingEnabled
              ? "No stock rows yet. Open a product and add on-hand quantity, or import stock from your warehouse tool."
              : "Turn on tracking to manage stock here."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/20">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-right">On hand</th>
                  <th className="px-6 py-3 text-right">Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const isLow =
                    r.reorderPoint != null && r.quantityOnHand.lte(r.reorderPoint);
                  return (
                    <tr
                      key={r.id}
                      className={isLow ? "bg-destructive/5" : "hover:bg-secondary/30 transition-colors"}
                    >
                      <td className="px-6 py-3 font-medium text-foreground">{r.product.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.product.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.product.productKind}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.warehouse.name}
                        {r.warehouse.isDefault ? (
                          <span className="ml-2 text-[10px] uppercase text-primary font-bold">Default</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {r.quantityOnHand.toString()}
                      </td>
                      <td className="px-6 py-3 text-right text-muted-foreground tabular-nums">
                        {r.reorderPoint?.toString() ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
