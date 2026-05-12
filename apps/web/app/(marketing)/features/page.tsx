import type { Metadata } from "next";
import MarketingShell from "@repo/ui/MarketingShell";

export const metadata: Metadata = {
  title: "Features | Invoicely",
  description:
    "Detailed capabilities — PDF invoices, recurring billing, dashboard, and more.",
};

const FEATURES = [
  {
    title: "Invoice editor & PDF export",
    body: "Draft line items with descriptions, taxes, and discounts. Export clean PDFs that match your brand.",
  },
  {
    title: "Dashboard & status tracking",
    body: "See drafts, sent, paid, and overdue at a glance. Know exactly where cash flow stands.",
  },
  {
    title: "Client & company profiles",
    body: "Store billing addresses, tax IDs, and notes per client so every document is accurate.",
  },
  {
    title: "Recurring invoices",
    body: "Schedule retainers and subscriptions so repeat billing happens without weekly babysitting.",
  },
  {
    title: "Email delivery hooks",
    body: "Send invoices from Invoicely and keep a trail of what went out and when.",
  },
  {
    title: "Secure authentication",
    body: "Email/password sign-in with sessions scoped to your organisation — not shared spreadsheets.",
  },
  {
    title: "Responsive workspace",
    body: "Works where you work — desktop-first flows that stay usable on tablet and mobile.",
  },
  {
    title: "Themes & readability",
    body: "Light-first UI with optional themes so long invoicing sessions stay easy on the eyes.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell
      logoSrc="/assets/invoicely.png"
      brandName="Invoicely"
      activeNav="features"
    >
      <header className="ms-page-hero">
        <h1>
          Features that respect your <em>time</em>.
        </h1>
        <p>
          No bloated accounting suite — just the tools solo founders and lean
          teams use every week to invoice, collect, and reconcile with clarity.
        </p>
      </header>

      <h2 className="ms-section-title">What you get</h2>
      <p className="ms-section-sub">
        Capabilities ship together — use the depth you need, skip what you
        don&apos;t.
      </p>

      <div className="ms-features-list">
        {FEATURES.map((f) => (
          <div key={f.title} className="ms-feature-row">
            <span className="ms-feature-check" aria-hidden>
              ✓
            </span>
            <div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section style={{ textAlign: "center", marginTop: 48 }}>
        <a href="/pricing" className="ms-btn-secondary" style={{ marginRight: 12 }}>
          View pricing
        </a>
        <a href="/login" className="ms-btn-primary">
          Start for free
        </a>
      </section>
    </MarketingShell>
  );
}
