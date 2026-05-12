const FX = [
  { code: "USD", name: "US Dollar", rate: 83.42 },
  { code: "EUR", name: "Euro", rate: 90.15 },
  { code: "GBP", name: "British Pound", rate: 105.6 },
  { code: "AED", name: "UAE Dirham", rate: 22.71 },
];

export default function MultiCurrencyPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Track entities operating internationally with base currency reporting and
        spot-rate snapshots per closing period.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground heading-display">
            Organization base
          </h2>
          <label className="mt-4 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reporting currency
            </span>
            <select className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
              <option>INR — Indian Rupee</option>
              <option>USD — US Dollar</option>
              <option>EUR — Euro</option>
            </select>
          </label>
          <p className="mt-4 text-xs text-muted-foreground">
            Sub-ledgers can book in local currencies; consolidation converts at
            month-end ECB/RBI references (configurable).
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground heading-display">
            Active FX pairs
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {FX.map((row) => (
              <li
                key={row.code}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{row.code}</p>
                  <p className="text-xs text-muted-foreground">{row.name}</p>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  1 {row.code} → ₹{row.rate.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
