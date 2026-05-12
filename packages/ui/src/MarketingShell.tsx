import type { ReactNode } from "react";

const ShellStyles = () => (
  <style>{`
    .ms-root {
      --ms-indigo: #4f35d2;
      --ms-indigo-dark: #3b27a8;
      --ms-text-dark: #1a1340;
      --ms-text-mid: #4a4468;
      --ms-text-light: #8b87aa;
      font-family: var(--font-marketing-body), sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(165deg, #fdfcff 0%, #f4f7ff 38%, #fefaff 72%, #fff9fb 100%);
      position: relative;
      overflow-x: hidden;
    }

    .ms-root::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 90% 50% at 50% -10%, rgba(79, 53, 210, 0.06) 0%, transparent 55%);
      pointer-events: none;
      z-index: 0;
    }

    .ms-inner {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    /* Nav — matches Hero */
    .ms-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px 16px 12px;
      margin: 0 auto;
      width: min(1100px, calc(100% - 40px));
      position: relative;
      z-index: 10;
    }

    .ms-nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-marketing-display), sans-serif;
      font-weight: 700;
      font-size: 1.85rem;
      color: var(--ms-text-dark);
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .ms-nav-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.05;
    }

    .ms-nav-logo-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ms-text-dark);
    }

    .ms-nav-logo-subtitle {
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: var(--ms-text-light);
      margin-top: 2px;
    }

    .ms-nav-logo-icon {
      width: 56px;
      height: 56px;
      border-radius: 7px;
      object-fit: contain;
    }

    .ms-nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      list-style: none;
    }

    .ms-nav-links a {
      text-decoration: none;
      color: var(--ms-text-mid);
      font-size: 0.9rem;
      font-weight: 500;
      padding: 8px 14px;
      border-radius: 12px;
      transition: color 0.2s, background 0.2s;
    }

    .ms-nav-links a:hover {
      color: var(--ms-indigo);
    }

    .ms-nav-links a.ms-active {
      color: var(--ms-indigo);
      background: rgba(79, 53, 210, 0.08);
    }

    .ms-btn-signin {
      background: var(--ms-text-dark);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ms-btn-signin:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .ms-main {
      flex: 1;
      width: min(1100px, calc(100% - 40px));
      margin: 0 auto;
      padding: 24px 24px 80px;
    }

    .ms-page-hero {
      text-align: center;
      padding: 32px 0 48px;
      max-width: 760px;
      margin: 0 auto;
    }

    .ms-page-hero h1 {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: clamp(2.25rem, 5vw, 3.25rem);
      font-weight: 700;
      color: var(--ms-text-dark);
      letter-spacing: -0.03em;
      line-height: 1.12;
      margin-bottom: 16px;
    }

    .ms-page-hero h1 em {
      font-style: normal;
      color: var(--ms-indigo);
    }

    .ms-page-hero p {
      color: var(--ms-text-light);
      font-size: clamp(1rem, 1.5vw, 1.15rem);
      line-height: 1.65;
      font-weight: 400;
    }

    .ms-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .ms-card {
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(79, 53, 210, 0.1);
      border-radius: 20px;
      padding: 28px 24px;
      box-shadow: 0 12px 40px rgba(79, 53, 210, 0.06);
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
    }

    .ms-card:hover {
      border-color: rgba(79, 53, 210, 0.22);
      box-shadow: 0 16px 48px rgba(79, 53, 210, 0.1);
      transform: translateY(-2px);
    }

    .ms-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(79, 53, 210, 0.12), rgba(124, 100, 232, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin-bottom: 16px;
    }

    .ms-card h2 {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--ms-text-dark);
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }

    .ms-card p {
      color: var(--ms-text-mid);
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .ms-section-title {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 700;
      color: var(--ms-text-dark);
      text-align: center;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .ms-section-sub {
      text-align: center;
      color: var(--ms-text-light);
      font-size: 1rem;
      max-width: 520px;
      margin: 0 auto 40px;
      line-height: 1.6;
    }

    .ms-features-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 720px;
      margin: 0 auto;
    }

    .ms-feature-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 20px 22px;
      background: rgba(255, 255, 255, 0.65);
      border: 1px solid rgba(79, 53, 210, 0.08);
      border-radius: 16px;
    }

    .ms-feature-check {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, #4f35d2, #7c64e8);
      color: white;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .ms-feature-row h3 {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--ms-text-dark);
      margin-bottom: 6px;
    }

    .ms-feature-row p {
      color: var(--ms-text-mid);
      font-size: 0.9rem;
      line-height: 1.55;
    }

    .ms-pricing-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      align-items: stretch;
      max-width: 920px;
      margin: 0 auto;
    }

    .ms-price-card {
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(79, 53, 210, 0.12);
      border-radius: 22px;
      padding: 32px 26px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 12px 36px rgba(79, 53, 210, 0.06);
    }

    .ms-price-card.ms-featured {
      border-color: rgba(79, 53, 210, 0.35);
      box-shadow: 0 20px 56px rgba(79, 53, 210, 0.14);
      transform: scale(1.02);
      z-index: 1;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 246, 255, 0.9) 100%);
    }

    .ms-price-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--ms-indigo);
      background: rgba(79, 53, 210, 0.1);
      padding: 5px 12px;
      border-radius: 100px;
      margin-bottom: 16px;
      width: fit-content;
    }

    .ms-price-card h2 {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--ms-text-dark);
      margin-bottom: 8px;
    }

    .ms-price-amount {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--ms-text-dark);
      margin-bottom: 6px;
    }

    .ms-price-amount span {
      font-size: 1rem;
      font-weight: 500;
      color: var(--ms-text-light);
    }

    .ms-price-desc {
      color: var(--ms-text-light);
      font-size: 0.88rem;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .ms-price-list {
      list-style: none;
      flex: 1;
      margin-bottom: 24px;
    }

    .ms-price-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.88rem;
      color: var(--ms-text-mid);
      padding: 8px 0;
      border-bottom: 1px solid rgba(79, 53, 210, 0.06);
    }

    .ms-price-list li:last-child {
      border-bottom: none;
    }

    .ms-price-list li::before {
      content: '✓';
      color: var(--ms-indigo);
      font-weight: 700;
      flex-shrink: 0;
    }

    .ms-btn-primary {
      background: var(--ms-indigo);
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: background 0.2s, transform 0.15s;
      box-shadow: 0 8px 24px rgba(79, 53, 210, 0.22);
    }

    .ms-btn-primary:hover {
      background: var(--ms-indigo-dark);
      transform: translateY(-1px);
    }

    .ms-btn-secondary {
      background: transparent;
      color: var(--ms-text-mid);
      border: 1px solid rgba(0, 0, 0, 0.12);
      padding: 14px 24px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: background 0.2s, border-color 0.2s;
    }

    .ms-btn-secondary:hover {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.18);
    }

    .ms-footer-note {
      text-align: center;
      padding: 48px 24px 32px;
      color: var(--ms-text-light);
      font-size: 0.82rem;
    }

    .ms-footer-note a {
      color: var(--ms-indigo);
      text-decoration: none;
      font-weight: 600;
    }

    .ms-footer-note a:hover {
      text-decoration: underline;
    }

    @media (max-width: 900px) {
      .ms-grid-3,
      .ms-pricing-grid {
        grid-template-columns: 1fr;
      }
      .ms-price-card.ms-featured {
        transform: none;
      }
    }

    @media (max-width: 768px) {
      .ms-nav {
        padding: 16px 16px 16px 8px;
      }
      .ms-nav-links {
        display: none;
      }
      .ms-main {
        padding: 16px 16px 64px;
      }
      .ms-page-hero {
        padding: 16px 0 36px;
      }
    }
  `}</style>
);

export type MarketingNavKey = "products" | "features" | "pricing";

export default function MarketingShell({
  children,
  logoSrc,
  brandName = "Invoicely",
  activeNav,
}: {
  children: ReactNode;
  logoSrc?: string;
  brandName?: string;
  activeNav?: MarketingNavKey;
}) {
  const links: { href: string; label: string; key: MarketingNavKey }[] = [
    { href: "/products", label: "Product", key: "products" },
    { href: "/features", label: "Features", key: "features" },
    { href: "/pricing", label: "Pricing", key: "pricing" },
  ];

  return (
    <>
      <ShellStyles />
      <div className="ms-root">
        <div className="ms-inner">
          <nav className="ms-nav">
            <a href="/" className="ms-nav-logo">
              {logoSrc ? (
                <>
                  <img
                    className="ms-nav-logo-icon"
                    src={logoSrc}
                    alt={brandName}
                  />
                  <span className="ms-nav-logo-text">
                    <span className="ms-nav-logo-title">{brandName}</span>
                    <span className="ms-nav-logo-subtitle">
                      Powered by AgilityAi
                    </span>
                  </span>
                </>
              ) : (
                <span className="ms-nav-logo-text">
                  <span className="ms-nav-logo-title">{brandName}</span>
                  <span className="ms-nav-logo-subtitle">
                    Powered by AgilityAi
                  </span>
                </span>
              )}
            </a>

            <ul className="ms-nav-links">
              {links.map(({ href, label, key }) => (
                <li key={key}>
                  <a href={href} className={activeNav === key ? "ms-active" : ""}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <a href="/login" className="ms-btn-signin">
              Sign In
            </a>
          </nav>

          <main className="ms-main">{children}</main>

          <footer className="ms-footer-note">
            <a href="/">← Back to home</a>
            {" · "}
            Questions?{" "}
            <a href="/login">Sign in</a> to your workspace.
          </footer>
        </div>
      </div>
    </>
  );
}
