"use client";

import { useEffect, useRef, useState } from "react";

// Inline styles as a style tag component
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --indigo: #4f35d2;
      --indigo-dark: #3b27a8;
      --indigo-light: #7c64e8;
      --soft-bg: #f0eeff;
      --sky: #c7dff7;
      --peach: #fde8df;
      --text-dark: #1a1340;
      --text-mid: #4a4468;
      --text-light: #8b87aa;
      --white: #ffffff;
      --card-bg: rgba(255,255,255,0.85);
      --shadow-soft: 0 8px 32px rgba(79,53,210,0.10);
      --shadow-card: 0 24px 64px rgba(79,53,210,0.13);
    }

    .hero-root {
      font-family: 'DM Sans', sans-serif;
      background: linear-gradient(135deg, #e8e2ff 0%, #d8eaff 40%, #fce8f3 70%, #fff8f0 100%);
      min-height: 100vh;
      overflow: hidden;
      position: relative;
    }

    .hero-bg-video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      opacity: 0.5;
      pointer-events: none;
    }

    .hero-video-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(232,226,255,0.78) 0%, rgba(216,234,255,0.68) 40%, rgba(252,232,243,0.68) 70%, rgba(255,248,240,0.78) 100%);
      z-index: 0;
      pointer-events: none;
    }

    /* ---- NAV ---- */
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: rgba(255,255,255,0.72);
      backdrop-filter: blur(20px);
      border-radius: 14px;
      margin: 14px auto 0;
      width: min(960px, calc(100% - 24px));
      box-shadow: 0 2px 24px rgba(79,53,210,0.07);
      position: relative;
      z-index: 10;
      gap: 12px;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 1.02rem;
      color: var(--text-dark);
      text-decoration: none;
      flex-shrink: 0;
    }

    .nav-logo-icon {
      width: 26px;
      height: 26px;
      background: linear-gradient(135deg, var(--indigo), var(--indigo-light));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 2px;
      list-style: none;
      min-width: 0;
      overflow: hidden;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--text-mid);
      font-size: 0.8rem;
      font-weight: 450;
      padding: 6px 9px;
      border-radius: 8px;
      transition: background 0.18s, color 0.18s;
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
    }

    .nav-links a:hover { background: rgba(79,53,210,0.07); color: var(--indigo); }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .nav-cart {
      width: 32px;
      height: 32px;
      background: rgba(79,53,210,0.08);
      border: none;
      border-radius: 9px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: background 0.18s;
    }
    .nav-cart:hover { background: rgba(79,53,210,0.15); }

    .cart-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 17px;
      height: 17px;
      background: var(--indigo);
      color: white;
      font-size: 0.6rem;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: var(--indigo);
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 10px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
      box-shadow: 0 3px 12px rgba(79,53,210,0.25);
      white-space: nowrap;
    }
    .btn-primary:hover {
      background: var(--indigo-dark);
      transform: translateY(-1px);
      box-shadow: 0 6px 22px rgba(79,53,210,0.35);
    }

    /* ---- HERO ---- */
    .hero-body {
      text-align: center;
      padding: 60px 40px 0;
      position: relative;
      z-index: 5;
    }

    .trust-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(79,53,210,0.12);
      padding: 8px 18px 8px 10px;
      border-radius: 100px;
      font-size: 0.86rem;
      color: var(--text-mid);
      font-weight: 500;
      margin-bottom: 28px;
      animation: fadeSlideDown 0.7s ease both;
    }

    .trust-badge-icon {
      width: 30px;
      height: 30px;
      background: linear-gradient(135deg, var(--indigo-light), var(--indigo));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-heading {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: clamp(3rem, 7vw, 5.4rem);
      font-weight: 800;
      color: var(--text-dark);
      line-height: 1.13;
      letter-spacing: -0.02em;
      max-width: 980px;
      margin: 0 auto 24px;
      animation: fadeSlideDown 0.7s 0.1s ease both;
    }

    .hero-heading em {
      font-style: normal;
      background: linear-gradient(90deg, var(--indigo), var(--indigo-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      color: var(--text-light);
      font-size: clamp(1.08rem, 1.5vw, 1.35rem);
      max-width: 760px;
      margin: 0 auto 40px;
      line-height: 1.65;
      font-weight: 400;
      animation: fadeSlideDown 0.7s 0.2s ease both;
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(79,53,210,0.10);
      border-radius: 16px;
      padding: 8px 8px 8px 20px;
      gap: 10px;
      box-shadow: 0 4px 24px rgba(79,53,210,0.10);
      animation: fadeSlideDown 0.7s 0.3s ease both;
    }

    .hero-cta input {
      border: none;
      background: transparent;
      outline: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      color: var(--text-dark);
      width: 220px;
    }
    .hero-cta input::placeholder { color: var(--text-light); }

    .btn-waitlist {
      background: var(--indigo);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 11px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.93rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.18s, transform 0.15s;
      box-shadow: 0 4px 16px rgba(79,53,210,0.30);
    }
    .btn-waitlist:hover { background: var(--indigo-dark); transform: translateY(-1px); }

    /* ---- CLOUD DECORATION ---- */
    .cloud-wrap {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 1;
    }

    .cloud {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.7);
      filter: blur(40px);
    }
    .cloud-1 { width: 400px; height: 200px; right: -60px; top: 200px; }
    .cloud-2 { width: 300px; height: 150px; right: 80px; top: 340px; background: rgba(255,255,255,0.5); filter: blur(30px); }
    .cloud-3 { width: 200px; height: 100px; left: 60px; top: 300px; }

    /* ---- DASHBOARD CARD ---- */
    .dashboard-wrap {
      margin: 50px auto 0;
      max-width: 860px;
      padding: 0 40px;
      position: relative;
      z-index: 5;
      animation: floatUp 0.9s 0.4s ease both;
    }

    .dashboard-card {
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(20px);
      border-radius: 24px 24px 0 0;
      box-shadow: var(--shadow-card);
      border: 1px solid rgba(255,255,255,0.9);
      overflow: hidden;
    }

    .dash-top {
      display: flex;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid rgba(79,53,210,0.07);
      gap: 16px;
    }

    .dash-logo {
      display: flex;
      align-items: center;
      gap: 7px;
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--text-dark);
      min-width: 120px;
    }

    .dash-search {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(79,53,210,0.05);
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 0.85rem;
      color: var(--text-light);
    }

    .dash-search kbd {
      margin-left: auto;
      background: rgba(79,53,210,0.08);
      padding: 2px 7px;
      border-radius: 5px;
      font-size: 0.75rem;
      color: var(--text-mid);
      font-family: inherit;
    }

    .dash-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }

    .dash-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f4a7b9, #f08d6e);
    }

    .dash-body { display: flex; }

    .dash-sidebar {
      width: 150px;
      padding: 16px 12px;
      border-right: 1px solid rgba(79,53,210,0.06);
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 10px;
      font-size: 0.82rem;
      color: var(--text-mid);
      font-weight: 450;
      cursor: pointer;
      transition: background 0.15s;
    }
    .sidebar-item:hover { background: rgba(79,53,210,0.06); }
    .sidebar-item.active { background: var(--indigo); color: white; font-weight: 600; }

    .sidebar-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: currentColor; opacity: 0.5; flex-shrink: 0;
    }

    .dash-main { flex: 1; padding: 18px 20px; }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: rgba(255,255,255,0.7);
      border: 1px solid rgba(79,53,210,0.08);
      border-radius: 14px;
      padding: 14px;
    }

    .stat-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      font-size: 1rem;
    }

    .stat-value {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-dark);
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .stat-badge {
      font-size: 0.65rem;
      font-family: 'DM Sans', sans-serif;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .badge-up { background: #e6f9f0; color: #1a9e5c; }
    .badge-down { background: #fff0f0; color: #e04040; }

    .stat-label { font-size: 0.75rem; color: var(--text-light); margin-top: 3px; }

    .bottom-row { display: grid; grid-template-columns: 1fr 180px; gap: 16px; }

    .chart-card {
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(79,53,210,0.08);
      border-radius: 14px;
      padding: 16px;
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .chart-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-dark);
    }

    .chart-filters { display: flex; gap: 4px; }
    .cf {
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-light);
      background: transparent;
      border: none;
      font-family: inherit;
    }
    .cf.active { background: var(--indigo); color: white; font-weight: 600; }

    .chart-area { height: 80px; position: relative; overflow: hidden; }

    .chart-area svg { width: 100%; height: 100%; }

    .realtime-card {
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(79,53,210,0.08);
      border-radius: 14px;
      padding: 16px;
    }

    .rt-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 14px;
    }

    .rt-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 0;
      border-bottom: 1px solid rgba(79,53,210,0.06);
    }
    .rt-item:last-child { border-bottom: none; }

    .rt-left { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--text-mid); }
    .rt-dot { width: 8px; height: 8px; border-radius: 50%; }
    .rt-count { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 0.9rem; color: var(--text-dark); }

    /* ---- ANIMATIONS ---- */
    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-18px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes floatUp {
      from { opacity: 0; transform: translateY(36px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .pulse-dot { animation: pulse 2s ease-in-out infinite; }

    @media (max-width: 1080px) {
      .nav-links li:nth-child(n+5) {
        display: none;
      }
    }

    @media (max-width: 900px) {
      .nav-links li:nth-child(n+4) {
        display: none;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav {
        margin: 10px auto 0;
        width: calc(100% - 16px);
        padding: 8px 10px;
        gap: 8px;
      }
      .nav-logo { font-size: 0.92rem; }
      .nav-logo-icon { width: 24px; height: 24px; }
      .nav-links { display: none; }
      .nav-right { gap: 6px; }
      .nav-cart { width: 30px; height: 30px; }
      .btn-primary {
        padding: 7px 10px;
        font-size: 0.76rem;
      }
      .hero-heading {
        font-size: clamp(2.2rem, 10vw, 3.2rem);
        max-width: 100%;
      }
      .hero-sub {
        font-size: 1rem;
        max-width: 95%;
      }
      .hero-body { padding: 40px 20px 0; }
      .dashboard-wrap { padding: 0 16px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .bottom-row { grid-template-columns: 1fr; }
      .dash-sidebar { display: none; }
      .hero-cta input { width: 160px; }
    }
  `}</style>
);

// Mini SVG chart
const MiniChart = () => (
  <svg
    viewBox="0 0 300 80"
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4f35d2" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#4f35d2" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0 70 L30 65 L60 68 L90 55 L120 58 L150 40 L155 42 L180 35 L210 45 L240 30 L270 38 L300 25"
      stroke="#4f35d2"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M0 70 L30 65 L60 68 L90 55 L120 58 L150 40 L155 42 L180 35 L210 45 L240 30 L270 38 L300 25 L300 80 L0 80 Z"
      fill="url(#chartGrad)"
    />
    {/* tooltip dot */}
    <circle cx="155" cy="42" r="4" fill="#4f35d2" />
    <rect x="130" y="26" width="60" height="20" rx="6" fill="#4f35d2" />
    <text
      x="160"
      y="40"
      textAnchor="middle"
      fill="white"
      fontSize="9"
      fontWeight="700"
      fontFamily="sans-serif"
    >
      Sep 28 · 1,065
    </text>
  </svg>
);

type HeroSectionProps = {
  backgroundVideoSrc?: string;
};

export default function HeroSection({
  backgroundVideoSrc,
}: HeroSectionProps = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [email, setEmail] = useState("");
  const [activeFilter, setActiveFilter] = useState("1M");

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = 0.6;
  }, [backgroundVideoSrc]);

  return (
    <>
      <GlobalStyles />
      <div className="hero-root">
        {backgroundVideoSrc ? (
          <>
            <video
              ref={videoRef}
              className="hero-bg-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={backgroundVideoSrc} type="video/mp4" />
            </video>
            <div className="hero-video-overlay" />
          </>
        ) : null}

        {/* Cloud decorations */}
        <div className="cloud-wrap">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>

        {/* Navbar */}
        <nav className="nav">
          <a href="#" className="nav-logo">
            <div className="nav-logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="6" cy="6" r="4" fill="white" opacity="0.9" />
                <circle cx="12" cy="12" r="3" fill="white" opacity="0.6" />
                <circle cx="13" cy="5" r="2" fill="white" opacity="0.75" />
              </svg>
            </div>
            Invoicely
          </a>

          <ul className="nav-links">
            {[
              "Home",
              "Invoices",
              "Expenses",
              "Clients",
              "Reports",
              "Resources",
            ].map(
              (item, i) => (
                <li key={item}>
                  <a href="#">
                    {item}
                    {[0, 1, 2, 4].includes(i) && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </a>
                </li>
              ),
            )}
          </ul>

          <div className="nav-right">
            <button className="nav-cart">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2h1.5l1.8 7.5h7l1.5-5H5"
                  stroke="#4f35d2"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="7" cy="13" r="1" fill="#4f35d2" />
                <circle cx="11" cy="13" r="1" fill="#4f35d2" />
              </svg>
              <span className="cart-badge">0</span>
            </button>
            <button className="btn-primary">Start Free</button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="hero-body">
          <div className="trust-badge">
            <div className="trust-badge-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M7.5 1L9.2 5.5H14L10.4 8.4L11.7 13L7.5 10.3L3.3 13L4.6 8.4L1 5.5H5.8L7.5 1Z"
                  fill="white"
                />
              </svg>
            </div>
            Trusted by 200K businesses sending invoices daily
          </div>

          <h1 className="hero-heading">
            Send invoices faster
            <br />
            with <em>smart billing automation</em>
          </h1>

          <p className="hero-sub">
            Create branded invoices, automate reminders, and track payments in
            one clean dashboard built for modern teams.
          </p>

          <div className="hero-cta">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4l6 5 6-5"
                stroke="#8b87aa"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect
                x="1"
                y="3"
                width="14"
                height="10"
                rx="2"
                stroke="#8b87aa"
                strokeWidth="1.5"
              />
            </svg>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn-waitlist">Start Invoicing</button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="dashboard-wrap">
          <div className="dashboard-card">
            {/* Top bar */}
            <div className="dash-top">
              <div className="dash-logo">
                <div
                  style={{
                    width: 24,
                    height: 24,
                    background: "linear-gradient(135deg, #4f35d2, #7c64e8)",
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle
                      cx="4.5"
                      cy="4.5"
                      r="3"
                      fill="white"
                      opacity="0.9"
                    />
                    <circle cx="9" cy="9" r="2.2" fill="white" opacity="0.6" />
                    <circle
                      cx="9.5"
                      cy="3.5"
                      r="1.5"
                      fill="white"
                      opacity="0.75"
                    />
                  </svg>
                </div>
                Invoicely
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  style={{ opacity: 0.4 }}
                >
                  <path
                    d="M2 3.5L5 6.5L8 3.5"
                    stroke="#4a4468"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="dash-search">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle
                    cx="5.5"
                    cy="5.5"
                    r="4"
                    stroke="#8b87aa"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9 9L11 11"
                    stroke="#8b87aa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Search invoices, clients, payments...
                <kbd>⌘ F</kbd>
              </div>

              <div className="dash-actions">
                {[
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 4l5 4 7-6"
                      stroke="#4a4468"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="1"
                      y="3"
                      width="14"
                      height="10"
                      rx="2"
                      stroke="#4a4468"
                      strokeWidth="1.5"
                    />
                  </svg>,
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2a5 5 0 015 5c0 2.5-1 4-2 5H5c-1-1-2-2.5-2-5a5 5 0 015-5z"
                      stroke="#4a4468"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M6 12v.5a2 2 0 004 0V12"
                      stroke="#4a4468"
                      strokeWidth="1.5"
                    />
                  </svg>,
                ].map((icon, i) => (
                  <button
                    key={i}
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(79,53,210,0.07)",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {icon}
                    <span
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -3,
                        width: 14,
                        height: 14,
                        background: "#4f35d2",
                        color: "white",
                        fontSize: "0.55rem",
                        fontWeight: 700,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      3
                    </span>
                  </button>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div className="dash-avatar" />
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{ opacity: 0.4 }}
                  >
                    <path
                      d="M2 3.5L5 6.5L8 3.5"
                      stroke="#4a4468"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dash-body">
              {/* Sidebar */}
              <div className="dash-sidebar">
                {[
                  { label: "Dashboard", active: true },
                  { label: "Invoices" },
                  { label: "Payments" },
                  { label: "Clients" },
                  { label: "Estimates" },
                  { label: "Taxes" },
                  { label: "Reports" },
                  { label: "Settings" },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    className={`sidebar-item ${active ? "active" : ""}`}
                  >
                    <div className="sidebar-dot" />
                    {label}
                    {!active && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        style={{ marginLeft: "auto", opacity: 0.4 }}
                      >
                        <path
                          d="M2 3.5L5 6.5L8 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              {/* Main */}
              <div className="dash-main">
                {/* Stats */}
                <div className="stats-row">
                  {[
                    {
                      icon: "🧾",
                      color: "#fff0e8",
                      value: "2,560",
                      badge: "+2.5%",
                      up: true,
                      label: "Invoices Sent",
                    },
                    {
                      icon: "💸",
                      color: "#e8f0ff",
                      value: "$136k",
                      badge: "+4.10%",
                      up: true,
                      label: "Revenue Collected",
                    },
                    {
                      icon: "👥",
                      color: "#f0e8ff",
                      value: "1,204",
                      badge: "+5.1%",
                      up: true,
                      label: "Active Clients",
                    },
                    {
                      icon: "⏳",
                      color: "#e8fff0",
                      value: "93",
                      badge: "-5.2%",
                      up: false,
                      label: "Overdue Invoices",
                    },
                  ].map(({ icon, color, value, badge, up, label }) => (
                    <div className="stat-card" key={label}>
                      <div className="stat-icon" style={{ background: color }}>
                        {icon}
                      </div>
                      <div className="stat-value">
                        {value}
                        <span
                          className={`stat-badge ${up ? "badge-up" : "badge-down"}`}
                        >
                          {up ? "↑" : "↓"} {badge}
                        </span>
                      </div>
                      <div className="stat-label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="bottom-row">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-title">Invoice Volume</div>
                      <div className="chart-filters">
                        {["1D", "5D", "1M", "ALL"].map((f) => (
                          <button
                            key={f}
                            className={`cf ${activeFilter === f ? "active" : ""}`}
                            onClick={() => setActiveFilter(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="chart-area">
                      <MiniChart />
                    </div>
                  </div>

                  <div className="realtime-card">
                    <div className="rt-title">Realtime Billing</div>
                    {[
                      { label: "Paid Today", count: 40, color: "#1a9e5c" },
                      { label: "Pending", count: 40, color: "#f08d2e" },
                    ].map(({ label, count, color }) => (
                      <div className="rt-item" key={label}>
                        <div className="rt-left">
                          <div
                            className="rt-dot pulse-dot"
                            style={{ background: color }}
                          />
                          {label}
                        </div>
                        <div className="rt-count">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
