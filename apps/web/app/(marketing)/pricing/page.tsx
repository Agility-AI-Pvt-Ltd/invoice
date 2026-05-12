import type { Metadata } from "next";
import MarketingShell from "@repo/ui/MarketingShell";

export const metadata: Metadata = {
  title: "Pricing | Invoicely",
  description:
    "Free for up to 500 invoices per year, or upgrade to Pro at ₹99/month with MCP, expenses, inventory, and more.",
};

export default function PricingPage() {
  return (
    <MarketingShell
      logoSrc="/assets/invoicely.png"
      brandName="Invoicely"
      activeNav="pricing"
    >
      <header className="ms-page-hero">
        <h1>
          Simple pricing in <em>Indian rupees</em>.
        </h1>
        <p>
          Start free with a generous yearly allowance, or unlock the full
          workspace for ₹99/month — MCP access, operations tooling, and
          unlimited invoicing.
        </p>
      </header>

      <div className="ms-pricing-grid">
        <div className="ms-price-card">
          <span className="ms-price-badge">Free</span>
          <h2>Starter</h2>
          <div className="ms-price-amount">
            ₹0 <span>/ forever</span>
          </div>
          <p className="ms-price-desc">
            Core invoicing for individuals getting started — clear limits, no
            surprises.
          </p>
          <ul className="ms-price-list">
            <li>500 invoices per year</li>
            <li>Client profiles &amp; line items</li>
            <li>PDF download &amp; email-ready flows</li>
            <li>Dashboard basics</li>
          </ul>
          <a href="/login" className="ms-btn-secondary">
            Start free
          </a>
        </div>

        <div className="ms-price-card ms-featured">
          <span className="ms-price-badge">Most popular</span>
          <h2>Pro</h2>
          <div className="ms-price-amount">
            ₹99 <span>/ month</span>
          </div>
          <p className="ms-price-desc">
            Full product — automations, inventory, expenses, and integrations
            in one subscription.
          </p>
          <ul className="ms-price-list">
            <li>MCP access</li>
            <li>Expenses</li>
            <li>Inventory management</li>
            <li>Unlimited invoices</li>
            <li>All templates</li>
            <li>Custom templates</li>
            <li>Receipt scanner</li>
          </ul>
          <a href="/login" className="ms-btn-primary">
            Subscribe to Pro
          </a>
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: 40,
          color: "#8b87aa",
          fontSize: "0.88rem",
          maxWidth: 520,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        Billing is processed in INR where applicable. Taxes may apply based on
        your region and entity type.
      </p>
    </MarketingShell>
  );
}
