import { prisma } from '@repo/db';
import InvoiceForm from './InvoiceForm';
import dashboardStyles from '../../page.module.css';
import Link from 'next/link';

import { requireAuth } from '../../../lib/auth';

export default async function NewInvoicePage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;

  let customers = await prisma.customer.findMany({
    where: { organizationId },
    select: { id: true, name: true, stateCode: true }
  });

  const products = await prisma.product.findMany({
    where: { organizationId },
    select: { id: true, name: true, price: true, hsnCode: true, taxRate: true }
  });
  
  let organization = await prisma.organization.findUnique({
    where: { id: organizationId }
  });

  if (customers.length === 0) {
    const dummyCustomer = await prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "Acme Corp (Intra-State)",
        stateCode: "27",
        gstin: "27AAAAA0000A1Z5",
        isRegistered: true,
      }
    });
    const dummyInterState = await prisma.customer.create({
      data: {
        organizationId: organization.id,
        name: "Globex Inc (Inter-State)",
        stateCode: "29", // Karnataka
        gstin: "29BBBBB0000B1Z5",
        isRegistered: true,
      }
    });
    customers = [
      { id: dummyCustomer.id, name: dummyCustomer.name, stateCode: dummyCustomer.stateCode },
      { id: dummyInterState.id, name: dummyInterState.name, stateCode: dummyInterState.stateCode }
    ];
  }

  return (
    <div className={dashboardStyles.dashboard}>
      {/* Sidebar - should ideally be a Layout component */}
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

      <main className={dashboardStyles.main}>
        <InvoiceForm 
          customers={customers} 
          products={products}
          orgStateCode={organization?.stateCode || "27"} 
        />
      </main>
    </div>
  );
}
