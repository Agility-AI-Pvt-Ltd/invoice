"use client";

import { useState } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600&display=swap');

    .hiw-root {
      font-family: 'DM Sans', sans-serif;
      background: #ffffff;
      color: #1a1340;
      overflow: hidden;
    }

    /* ── LOGO STRIP ── */
    .logo-strip {
      padding: 52px 0 60px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .logo-strip::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(199,185,255,0.35) 0%, transparent 70%);
      pointer-events: none;
    }
    .logo-strip-label {
      font-size: 0.88rem;
      font-weight: 500;
      color: #8b87aa;
      margin-bottom: 28px;
      position: relative;
    }

    /* marquee track */
    .marquee-outer {
      position: relative;
      width: 100%;
      overflow: hidden;
    }
    /* fade edges */
    .marquee-outer::before,
    .marquee-outer::after {
      content: '';
      position: absolute;
      top: 0; bottom: 0;
      width: 120px;
      z-index: 2;
      pointer-events: none;
    }
    .marquee-outer::before {
      left: 0;
      background: linear-gradient(to right, #ffffff 0%, transparent 100%);
    }
    .marquee-outer::after {
      right: 0;
      background: linear-gradient(to left, #ffffff 0%, transparent 100%);
    }
    .marquee-track {
      display: flex;
      gap: 12px;
      width: max-content;
      animation: marqueeScroll 28s linear infinite;
    }
    .marquee-track:hover {
      animation-play-state: paused;
    }
    @keyframes marqueeScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .logo-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(79,53,210,0.1);
      border-radius: 12px;
      padding: 10px 18px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #4a4468;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.18s;
      cursor: default;
      box-shadow: 0 2px 12px rgba(79,53,210,0.06);
    }
    .logo-chip:hover {
      border-color: rgba(79,53,210,0.28);
      box-shadow: 0 4px 18px rgba(79,53,210,0.12);
      transform: translateY(-2px);
    }
    .logo-chip-icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ── HOW IT WORKS ── */
    .hiw-section {
      padding: 20px 48px 80px;
      text-align: center;
    }
    .hiw-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(79,53,210,0.07);
      border: 1px solid rgba(79,53,210,0.12);
      border-radius: 100px;
      padding: 6px 14px 6px 8px;
      font-size: 0.82rem;
      font-weight: 500;
      color: #4f35d2;
      margin-bottom: 20px;
    }
    .hiw-badge-dot {
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, #4f35d2, #7c64e8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hiw-h2 {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 800;
      color: #1a1340;
      letter-spacing: -0.02em;
      margin-bottom: 14px;
    }
    .hiw-sub {
      color: #8b87aa;
      font-size: 0.97rem;
      max-width: 460px;
      margin: 0 auto 40px;
      line-height: 1.7;
    }

    /* ── TABS ── */
    .hiw-tabs {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(79,53,210,0.05);
      border: 1px solid rgba(79,53,210,0.1);
      border-radius: 100px;
      padding: 6px;
      margin-bottom: 56px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .hiw-tab {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 9px 18px;
      border-radius: 100px;
      font-size: 0.88rem;
      font-weight: 500;
      color: #8b87aa;
      cursor: pointer;
      border: none;
      background: transparent;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.18s;
    }
    .hiw-tab:hover { color: #4a4468; }
    .hiw-tab.active {
      background: #4f35d2;
      color: white;
      box-shadow: 0 4px 16px rgba(79,53,210,0.28);
    }
    .hiw-tab .tab-icon {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.2);
      font-size: 11px;
    }
    .hiw-tab:not(.active) .tab-icon {
      background: rgba(79,53,210,0.1);
    }

    /* ── CONTENT PANEL ── */
    .hiw-panel {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 56px;
      align-items: center;
      text-align: left;
      max-width: 1020px;
      margin: 0 auto;
    }
    .panel-tag {
      display: inline-block;
      border: 1px solid rgba(79,53,210,0.2);
      border-radius: 8px;
      padding: 4px 12px;
      font-size: 0.78rem;
      font-weight: 500;
      color: #4a4468;
      margin-bottom: 18px;
    }
    .panel-h3 {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: clamp(1.7rem, 3vw, 2.4rem);
      font-weight: 800;
      color: #1a1340;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 16px;
    }
    .panel-p {
      color: #8b87aa;
      font-size: 0.95rem;
      line-height: 1.72;
      margin-bottom: 32px;
      max-width: 400px;
    }
    .btn-get-started {
      background: #4f35d2;
      color: white;
      border: none;
      padding: 13px 28px;
      border-radius: 100px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      box-shadow: 0 4px 18px rgba(79,53,210,0.3);
    }
    .btn-get-started:hover {
      background: #3b27a8;
      transform: translateY(-1px);
      box-shadow: 0 6px 24px rgba(79,53,210,0.38);
    }

    /* ── CHART CARD ── */
    .chart-card {
      background: linear-gradient(145deg, #f0eeff 0%, #e8e2ff 40%, #d8eaff 80%);
      border-radius: 22px;
      padding: 28px;
      box-shadow: 0 16px 56px rgba(79,53,210,0.12);
      border: 1px solid rgba(79,53,210,0.08);
    }
    .chart-card-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a1340;
      margin-bottom: 20px;
    }
    .chart-y-labels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 24px;
      font-size: 0.68rem;
      color: #8b87aa;
    }
    .chart-wrap {
      position: relative;
      padding-left: 36px;
    }
    .chart-svg {
      width: 100%;
      height: 160px;
    }
    .chart-x-label {
      font-size: 0.68rem;
      color: #8b87aa;
      margin-top: 6px;
      padding-left: 36px;
      text-align: left;
    }

    /* ── INVOICE PREVIEW CARD ── */
    .invoice-card {
      background: white;
      border-radius: 22px;
      padding: 24px;
      box-shadow: 0 16px 56px rgba(79,53,210,0.12);
      border: 1px solid rgba(79,53,210,0.08);
    }
    .inv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .inv-brand {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800;
      font-size: 1rem;
      color: #1a1340;
    }
    .inv-status {
      background: #e6faf5;
      color: #009e77;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 100px;
    }
    .inv-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      padding: 7px 0;
      border-bottom: 1px solid rgba(79,53,210,0.06);
      color: #4a4468;
    }
    .inv-line:last-child { border: none; }
    .inv-line-label { color: #8b87aa; }
    .inv-total {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 2px solid rgba(79,53,210,0.1);
    }
    .inv-total-label { font-weight: 600; font-size: 0.9rem; color: #1a1340; }
    .inv-total-amt {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.2rem;
      font-weight: 800;
      color: #4f35d2;
    }
    .inv-progress {
      margin-top: 16px;
      background: #f0eeff;
      border-radius: 100px;
      height: 6px;
      overflow: hidden;
    }
    .inv-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4f35d2, #7c64e8);
      border-radius: 100px;
      width: 72%;
    }

    /* ── REALTIME CARD ── */
    .realtime-card {
      background: white;
      border-radius: 22px;
      padding: 24px;
      box-shadow: 0 16px 56px rgba(79,53,210,0.12);
      border: 1px solid rgba(79,53,210,0.08);
    }
    .rt-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(79,53,210,0.06);
    }
    .rt-row:last-child { border: none; }
    .rt-left { display: flex; align-items: center; gap: 10px; }
    .rt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rt-label { font-size: 0.84rem; color: #4a4468; font-weight: 500; }
    .rt-val { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 0.92rem; color: #1a1340; }
    .rt-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 7px; border-radius: 6px; }

    @media (max-width: 768px) {
      .hiw-panel { grid-template-columns: 1fr; gap: 32px; }
      .hiw-section { padding: 20px 20px 60px; }
      .logo-strip { padding: 40px 20px 50px; }
    }
  `}</style>
);

// Mini SVG Chart for tab 1
const RevenueChart = () => (
  <svg
    className="chart-svg"
    viewBox="0 0 360 160"
    preserveAspectRatio="none"
    fill="none"
  >
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4f35d2" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#4f35d2" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* grid lines */}
    {[30, 70, 110, 130].map((y, i) => (
      <line
        key={i}
        x1="0"
        y1={y}
        x2="360"
        y2={y}
        stroke="#e8e2ff"
        strokeWidth="1"
      />
    ))}
    {/* area */}
    <path
      d="M0 130 L40 122 L80 126 L110 100 L145 106 L175 78 L195 84 L230 58 L265 66 L300 44 L330 36 L360 28 L360 160 L0 160Z"
      fill="url(#chartFill)"
    />
    {/* line */}
    <path
      d="M0 130 L40 122 L80 126 L110 100 L145 106 L175 78 L195 84 L230 58 L265 66 L300 44 L330 36 L360 28"
      stroke="#4f35d2"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* tooltip point */}
    <circle cx="230" cy="58" r="5" fill="#4f35d2" />
    <rect x="200" y="38" width="72" height="20" rx="6" fill="#1a1340" />
    <text
      x="236"
      y="52"
      textAnchor="middle"
      fill="white"
      fontSize="9"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      $84.2k
    </text>
    {/* dashed line */}
    <line
      x1="230"
      y1="58"
      x2="230"
      y2="160"
      stroke="#4f35d2"
      strokeWidth="1.5"
      strokeDasharray="4 3"
      opacity="0.4"
    />
  </svg>
);

const tabs = [
  {
    id: "connect",
    label: "Create & Send Invoices",
    icon: "📄",
    tag: "Create & Send Invoices",
    heading: "Professional\nInvoices in Seconds",
    body: "Turn your work into polished, branded invoices with a single click. Add line items, taxes, and payment terms — then send directly to your client's inbox.",
    visual: "chart",
  },
  {
    id: "monitor",
    label: "Track Payments Live",
    icon: "🔔",
    tag: "Live Payment Tracking",
    heading: "Know Exactly\nWho Owes What",
    body: "Monitor every invoice in real time — see when clients open, view, and pay. Get instant notifications and automated reminders for overdue amounts.",
    visual: "invoice",
  },
  {
    id: "impact",
    label: "Grow Your Revenue",
    icon: "📊",
    tag: "Revenue Intelligence",
    heading: "Turn Invoices\nInto Insights",
    body: "Understand your cash flow with rich analytics. See top clients, peak billing months, and overdue trends — so you can make smarter business decisions.",
    visual: "realtime",
  },
];

const logos = [
  { name: "Stripe", icon: "💳", color: "#635bff" },
  { name: "QuickBooks", icon: "📒", color: "#2ca01c" },
  { name: "Xero", icon: "🔵", color: "#13b5ea" },
  { name: "Slack", icon: "💬", color: "#4a154b" },
  { name: "Zapier", icon: "⚡", color: "#ff4a00" },
  { name: "PayPal", icon: "🅿", color: "#003087" },
  { name: "Pipedrive", icon: "🔧", color: "#1a1f36" },
  { name: "HubSpot", icon: "🟠", color: "#ff7a59" },
  { name: "FreshBooks", icon: "📗", color: "#1cad57" },
];

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState("connect");
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0]!;

  return (
    <>
      <GlobalStyles />
      <div className="hiw-root">
        {/* ── LOGO STRIP ── */}
        <div className="logo-strip">
          <p className="logo-strip-label">
            Integrates with your favourite tools
          </p>
          <div className="marquee-outer">
            <div className="marquee-track">
              {/* render twice for seamless loop */}
              {[...logos, ...logos].map((logo, i) => (
                <div className="logo-chip" key={i}>
                  <div
                    className="logo-chip-icon"
                    style={{ background: logo.color + "18" }}
                  >
                    <span style={{ fontSize: "13px" }}>{logo.icon}</span>
                  </div>
                  {logo.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="hiw-section">
          <div className="hiw-badge">
            <div className="hiw-badge-dot">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="3.5" fill="white" opacity="0.9" />
                <circle cx="5.5" cy="5.5" r="1.8" fill="white" />
              </svg>
            </div>
            Process
          </div>

          <h2 className="hiw-h2">How it works</h2>
          <p className="hiw-sub">
            Invoicely simplifies getting paid by turning your work into
            professional invoices, automating follow-ups, and giving you a clear
            view of every dollar.
          </p>

          {/* TABS */}
          <div className="hiw-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`hiw-tab${activeTab === tab.id ? " active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTENT PANEL */}
          <div className="hiw-panel">
            {/* LEFT: text */}
            <div>
              <div className="panel-tag">{current.tag}</div>
              <h3 className="panel-h3">
                {current.heading.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h3>
              <p className="panel-p">{current.body}</p>
              <button className="btn-get-started">Get Started</button>
            </div>

            {/* RIGHT: visual */}
            <div>
              {current.visual === "chart" && (
                <div className="chart-card">
                  <div className="chart-card-title">Revenue Overview</div>
                  <div className="chart-wrap">
                    <div className="chart-y-labels">
                      <span>$90k</span>
                      <span>$60k</span>
                      <span>$30k</span>
                      <span>$0</span>
                    </div>
                    <RevenueChart />
                  </div>
                  <div className="chart-x-label">Sep 15 → Oct 15</div>
                </div>
              )}

              {current.visual === "invoice" && (
                <div className="invoice-card">
                  <div className="inv-header">
                    <div className="inv-brand">Invoicely</div>
                    <span className="inv-status">Viewed</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#8b87aa",
                      marginBottom: 14,
                    }}
                  >
                    INV-0091 · Due Nov 15, 2026
                  </div>
                  {[
                    { label: "Brand Design", qty: "1", amt: "$2,400" },
                    { label: "Website Revamp", qty: "1", amt: "$1,800" },
                    { label: "SEO Consultation", qty: "3 hrs", amt: "$450" },
                  ].map((item) => (
                    <div className="inv-line" key={item.label}>
                      <span>{item.label}</span>
                      <span style={{ color: "#8b87aa", marginLeft: 8 }}>
                        {item.qty}
                      </span>
                      <span style={{ fontWeight: 600, color: "#1a1340" }}>
                        {item.amt}
                      </span>
                    </div>
                  ))}
                  <div className="inv-total">
                    <span className="inv-total-label">Total Due</span>
                    <span className="inv-total-amt">$4,650</span>
                  </div>
                  <div className="inv-progress">
                    <div className="inv-progress-bar" />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 6,
                      fontSize: "0.72rem",
                      color: "#8b87aa",
                    }}
                  >
                    <span>Payment progress</span>
                    <span>72% collected</span>
                  </div>
                </div>
              )}

              {current.visual === "realtime" && (
                <div className="realtime-card">
                  <div
                    style={{
                      fontFamily: "'Bricolage Grotesque',sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#1a1340",
                      marginBottom: 18,
                    }}
                  >
                    Revenue Snapshot
                  </div>
                  {[
                    {
                      label: "Collected this month",
                      val: "$84,200",
                      badge: "+12.4%",
                      badgeStyle: { background: "#e6faf5", color: "#009e77" },
                      dot: "#4f35d2",
                    },
                    {
                      label: "Pending invoices",
                      val: "$12,800",
                      badge: "18 due",
                      badgeStyle: { background: "#fff7e6", color: "#d48a00" },
                      dot: "#ffb347",
                    },
                    {
                      label: "Overdue",
                      val: "$3,100",
                      badge: "↓ 2.3%",
                      badgeStyle: { background: "#fff0f0", color: "#cc3333" },
                      dot: "#ff5c5c",
                    },
                    {
                      label: "Paid clients (MTD)",
                      val: "47",
                      badge: "+5 new",
                      badgeStyle: { background: "#e6faf5", color: "#009e77" },
                      dot: "#4f35d2",
                    },
                  ].map((row) => (
                    <div className="rt-row" key={row.label}>
                      <div className="rt-left">
                        <div
                          className="rt-dot"
                          style={{ background: row.dot }}
                        />
                        <span className="rt-label">{row.label}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span className="rt-val">{row.val}</span>
                        <span className="rt-badge" style={row.badgeStyle}>
                          {row.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
