// Inline styles as a style tag component
const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --indigo: #4f35d2;
      --indigo-dark: #3b27a8;
      --indigo-light: #7c64e8;
      --text-dark: #1a1340;
      --text-mid: #4a4468;
      --text-light: #8b87aa;
      --white: #ffffff;
    }

    .hero-root {
      font-family: var(--font-marketing-body), sans-serif;
      background: linear-gradient(135deg, #fdfcff 0%, #f4f7ff 40%, #fefaff 100%);
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    .hero-video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(253, 252, 255, 0.78);
      backdrop-filter: blur(1px);
      z-index: 1;
    }

    /* ---- NAV ---- */
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px 16px 12px;
      margin: 0px auto 0;
      width: min(1100px, calc(100% - 40px));
      position: relative;
      z-index: 10;
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-marketing-display), sans-serif;
      font-weight: 800;
      font-size: 1.85rem;
      color: var(--text-dark);
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .nav-logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.05;
    }

    .nav-logo-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-dark);
    }

    .nav-logo-subtitle {
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      color: var(--text-light);
      margin-top: 2px;
    }

    .nav-logo-icon {
      width: 80px;
      height: 80px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      object-fit: contain;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 12px;
      list-style: none;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--text-mid);
      font-size: 0.9rem;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .nav-links a:hover { 
      color: var(--indigo);
    }

    .btn-nav {
      background: var(--text-dark);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    /* ---- HERO ---- */
    .hero-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px 100px;
      position: relative;
      z-index: 2;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(30px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    .hero-heading {
      font-family: var(--font-marketing-display), sans-serif;
      font-size: clamp(3.5rem, 9vw, 6.5rem);
      font-weight: 800;
      color: var(--text-dark);
      line-height: 0.95;
      letter-spacing: -0.05em;
      max-width: 1120px;
      margin-bottom: 32px;
      opacity: 0;
      animation: fadeUp 0.8s ease forwards 0.1s;
    }

    .hero-heading em {
      font-style: normal;
      color: var(--indigo);
    }

    .hero-sub {
      color: var(--text-light);
      font-size: clamp(1.1rem, 1.8vw, 1.35rem);
      max-width: 820px;
      margin: 0 auto 56px;
      line-height: 1.5;
      font-weight: 400;
      opacity: 0;
      animation: fadeUp 0.8s ease forwards 0.3s;
    }

    .hero-cta-group {
      display: flex;
      align-items: center;
      gap: 16px;
      opacity: 0;
      animation: fadeUp 0.8s ease forwards 0.5s;
    }

    .btn-main {
      background: var(--indigo);
      color: white;
      border: none;
      padding: 16px 36px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 12px 30px rgba(79,53,210,0.2);
    }
    .btn-main:hover {
      background: var(--indigo-dark);
      transform: translateY(-2px);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-mid);
      border: 1px solid rgba(0,0,0,0.1);
      padding: 16px 36px;
      border-radius: 100px;
      font-family: var(--font-marketing-body), sans-serif;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline:hover {
      background: rgba(0,0,0,0.02);
      border-color: rgba(0,0,0,0.2);
    }

    /* Subtle background circle */
    .bg-glow {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(79,53,210,0.03) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    @media (max-width: 768px) {
      .nav { padding: 16px 16px 16px 8px; }
      .nav-links { display: none; }
      .hero-heading { font-size: 3.2rem; }
      .hero-cta-group { flex-direction: column; width: 100%; max-width: 300px; }
      .btn-main, .btn-outline { width: 100%; }
    }
  `}</style>
);

export default function HeroSection({
  logoSrc,
  brandName = "Invoicely",
}: {
  logoSrc?: string;
  brandName?: string;
}) {
  return (
    <>
      <GlobalStyles />
      <div className="hero-root">
        <video
          className="hero-video"
          src="/assets/herobg.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
        <div className="hero-overlay" />

        {/* Navbar */}

        <nav className="nav">
          <a href="/" className="nav-logo">
            {logoSrc ? (
              <>
                <img className="nav-logo-icon" src={logoSrc} alt={brandName} />
                <span className="nav-logo-text">
                  <span className="nav-logo-title">{brandName}</span>
                  <span className="nav-logo-subtitle">
                    Powered by AgilityAi
                  </span>
                </span>
              </>
            ) : (
              <>
                <div className="nav-logo-icon" aria-hidden="true" />
                <span className="nav-logo-text">
                  <span className="nav-logo-title">{brandName}</span>
                  <span className="nav-logo-subtitle">
                    Powered by AgilityAi
                  </span>
                </span>
              </>
            )}
          </a>

          <ul className="nav-links">
            {[
              { label: "Product", href: "/products" },
              { label: "Features", href: "/features" },
              { label: "Pricing", href: "/pricing" },
            ].map(({ label, href }) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>

          <a
            href="/login"
            className="btn-nav"
            style={{ textDecoration: "none" }}
          >
            Sign In
          </a>
        </nav>

        {/* Hero content */}
        <div className="hero-body">
          <h1 className="hero-heading">
            The <em>operating system</em>
            <br />
            for your business.
          </h1>

          <p className="hero-sub">
            The minimalist platform to create, send, and automate professional
            invoices without the bloat of traditional accounting software.
          </p>

          <div className="hero-cta-group">
            <a href="/login" className="btn-main">
              Get Started Free
            </a>
            <button className="btn-outline">Watch Demo</button>
          </div>
        </div>
      </div>
    </>
  );
}
