import Link from "next/link";
import { prisma } from "@repo/db";
import styles from "./page.module.css";
import dashboardStyles from "../page.module.css";
import { requireAuth } from "../../lib/auth";

export default async function InvoicesPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  // Fetch invoices from the DB
  const invoices = await prisma.invoice.findMany({
    where: { organizationId },
    include: {
      customer: true,
    },
    orderBy: {
      issueDate: 'desc'
    }
  });

  return (
    <div className={dashboardStyles.dashboard}>
      {/* Sidebar - In a real app we'd extract this to a Layout component */}
      <aside className={dashboardStyles.sidebar}>
        <div className={dashboardStyles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          InvoiceHQ
        </div>
        
        <nav className={dashboardStyles.nav}>
          <Link href="/" className={dashboardStyles.navItem}>
            Dashboard
          </Link>
          <Link href="/invoices" className={`${dashboardStyles.navItem} ${dashboardStyles.active}`}>
            Invoices
          </Link>
          <Link href="/customers" className={dashboardStyles.navItem}>
            Customers
          </Link>
          <Link href="/products" className={dashboardStyles.navItem}>
            Products
          </Link>
          <Link href="/settings" className={dashboardStyles.navItem}>
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={dashboardStyles.main}>
        <header className={dashboardStyles.header}>
          <h1 className={dashboardStyles.title}>Invoices</h1>
          <Link href="/invoices/new" className={dashboardStyles.button}>+ Create Invoice</Link>
        </header>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No invoices found. Create your first one!
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className={styles.invoiceId}>#{invoice.invoiceNumber}</td>
                    <td>{invoice.customer.name}</td>
                    <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className={styles.amount}>${invoice.total.toFixed(2)}</td>
                    <td>
                      <span className={`${styles.status} ${styles[invoice.status.toLowerCase()]}`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
