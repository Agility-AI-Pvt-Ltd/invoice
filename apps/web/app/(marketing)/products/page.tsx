import type { Metadata } from "next";
import MarketingShell from "@repo/ui/MarketingShell";

export const metadata: Metadata = {
  title: "Product | Invoicely",
  description:
    "Invoicing, payments, clients, and automation — one minimalist platform for your business.",
};

export default function ProductsPage() {
  return (
    <MarketingShell
      logoSrc="/assets/invoicely.png"
      brandName="Invoicely"
      activeNav="products"
    >
      <header className="ms-page-hero">
        <h1>
          Everything you need to run <em>billing</em>, in one place.
        </h1>
        <p>
          Invoicely brings invoicing, client records, and payment workflows into
          a single calm surface — so you spend less time in spreadsheets and
          more time on your business.
        </p>
      </header>

      <section aria-labelledby="products-grid-title">
        <h2 id="products-grid-title" className="ms-section-title">
          Built for modern operators
        </h2>
        <p className="ms-section-sub">
          Four pillars that work together — pick what you need today, grow into
          the rest tomorrow.
        </p>

        <div className="ms-grid-3">
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              📄
            </div>
            <h2>Smart invoicing</h2>
            <p>
              Create polished invoices in seconds, reuse line items and brands,
              and send professional PDFs without leaving the app.
            </p>
          </article>
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              💳
            </div>
            <h2>Payments &amp; reminders</h2>
            <p>
              Accept payments with integrated flows, track status at a glance,
              and nudge clients gently when invoices are due.
            </p>
          </article>
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              👥
            </div>
            <h2>Client workspace</h2>
            <p>
              Keep contacts, billing history, and notes aligned so every invoice
              feels personal — without digging through email threads.
            </p>
          </article>
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              ⚡
            </div>
            <h2>Automation-ready</h2>
            <p>
              Recurring invoices and repeatable workflows cut manual work so
              recurring revenue runs on autopilot.
            </p>
          </article>
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              📊
            </div>
            <h2>Insightful summaries</h2>
            <p>
              See what&apos;s outstanding, what&apos;s paid, and what&apos;s due
              — without exporting to a second tool.
            </p>
          </article>
          <article className="ms-card">
            <div className="ms-card-icon" aria-hidden>
              🔒
            </div>
            <h2>Built for teams</h2>
            <p>
              Structure your organisation so the right people can issue,
              review, and reconcile — without sharing logins.
            </p>
          </article>
        </div>
      </section>

      <section style={{ textAlign: "center", marginTop: 56 }}>
        <a href="/login" className="ms-btn-primary">
          Get started free
        </a>
      </section>
    </MarketingShell>
  );
}
