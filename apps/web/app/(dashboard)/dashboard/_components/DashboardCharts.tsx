"use client";

import { RevenueAreaChart } from "./RevenueAreaChart";
import { InvoiceStatusDonut } from "./InvoiceStatusDonut";
import { TopCustomersChart } from "./TopCustomersChart";
import { TrendingUp, PieChart, Users } from "lucide-react";

type DashboardChartsProps = {
  revenueData: { month: string; revenue: number }[];
  statusData: { status: string; count: number; color: string }[];
  topCustomers: { name: string; revenue: number }[];
};

export function DashboardCharts({
  revenueData,
  statusData,
  topCustomers,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Trend */}
      <div className="lg:col-span-2 bg-card border border-border rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
          <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Revenue Trend
          </h2>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            All Invoices · Last 6 Months
          </span>
        </div>
        <div className="p-6">
          <RevenueAreaChart data={revenueData} />
        </div>
      </div>

      {/* Invoice Status Donut */}
      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
          <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
            <PieChart className="w-4 h-4 text-primary" />
            Invoice Status
          </h2>
        </div>
        <div className="p-4">
          <InvoiceStatusDonut data={statusData} />
          {/* Legend */}
          {statusData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2 px-2">
              {statusData
                .filter((d) => d.count > 0)
                .map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {d.status.replace("_", " ")} ({d.count})
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="lg:col-span-3 bg-card border border-border rounded-3xl shadow-sm overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
          <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
            <Users className="w-4 h-4 text-blue-500" />
            Top Customers by Revenue
          </h2>
          <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Paid Invoices
          </span>
        </div>
        <div className="p-6">
          <TopCustomersChart data={topCustomers} />
        </div>
      </div>
    </div>
  );
}
