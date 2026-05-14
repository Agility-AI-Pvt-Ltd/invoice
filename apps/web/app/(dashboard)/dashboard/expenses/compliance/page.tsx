import { ShieldCheck } from "lucide-react";

const EVENTS = [
  {
    id: "1",
    time: "May 11 · 09:42",
    actor: "finance@acme.io",
    detail: "Marked payroll run as GST-inclusive supply",
  },
  {
    id: "2",
    time: "May 10 · 16:08",
    actor: "approvals-bot",
    detail: "Receipt OCR matched Invoice INV-204 (confidence 0.94)",
  },
  {
    id: "3",
    time: "May 09 · 11:21",
    actor: "owner@acme.io",
    detail: "Flagged marketing spend as deductible · campaign Q2",
  },
];

export default function TaxCompliancePage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground heading-display">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            GST / VAT tagging
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tag ledger lines with jurisdiction defaults and override per
            transaction when you operate across regions.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Default GST treatment
              </span>
              <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                <option>Standard rated (18%)</option>
                <option>Export — LUT</option>
                <option>Exempt</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                VAT profile
              </span>
              <select className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground">
                <option>India — GST</option>
                <option>EU — OSS placeholder</option>
                <option>US — Sales tax (future)</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-bold text-foreground heading-display">
            Deductible rules
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <input type="checkbox" defaultChecked className="mt-1" />
              Auto-flag SaaS & payroll as deductible
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" defaultChecked className="mt-1" />
              Require receipt for marketing over ₹25,000
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" />
              Block travel without per-diem policy match
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-bold text-foreground heading-display">
            Audit trail
          </h2>
          <p className="text-xs text-muted-foreground">
            Immutable history for compliance reviews (demo entries).
          </p>
        </div>
        <ul className="divide-y divide-border">
          {EVENTS.map((e) => (
            <li key={e.id} className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {e.time}
              </p>
              <p className="mt-1 font-semibold text-foreground">{e.detail}</p>
              <p className="text-xs text-muted-foreground">By {e.actor}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
