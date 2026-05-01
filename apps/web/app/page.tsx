import Link from "next/link";
import styles from "./page.module.css";
import { requireAuth } from "../lib/auth";

export default async function Home() {
  const user = await requireAuth();
  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          InvoiceHQ
        </div>
        
        <nav className={styles.nav}>
          <Link href="/" className={`${styles.navItem} ${styles.active}`}>
            Dashboard
          </Link>
          <Link href="/invoices" className={styles.navItem}>
            Invoices
          </Link>
          <Link href="/customers" className={styles.navItem}>
            Customers
          </Link>
          <Link href="/products" className={styles.navItem}>
            Products
          </Link>
          <Link href="/settings" className={styles.navItem}>
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <button className={styles.button}>+ New Invoice</button>
        </header>

        {/* Summary Cards */}
        <div className={styles.cardGrid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Total Revenue</h3>
            <div className={styles.cardValue}>$24,500.00</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Outstanding</h3>
            <div className={styles.cardValue}>$3,200.00</div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Overdue</h3>
            <div className={styles.cardValue}>$850.00</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            Recent Invoices
          </div>
          <div className={styles.emptyState}>
            <p>No recent invoices found.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Create your first invoice to see it here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
