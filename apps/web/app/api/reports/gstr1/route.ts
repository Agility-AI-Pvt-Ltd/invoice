import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../../lib/auth';

/**
 * GSTR-1 Export API
 * 
 * Returns a JSON payload (compatible with GSTR-1 filing format) for a given month.
 * Also returns a CSV download option via ?format=csv
 * 
 * Usage:
 *   GET /api/reports/gstr1?month=2024-03          → JSON
 *   GET /api/reports/gstr1?month=2024-03&format=csv → downloadable CSV
 * 
 * GSTR-1 sections covered:
 *   B2B  — Invoices to registered GST businesses
 *   B2C  — Invoices to unregistered buyers
 */
export async function GET(req: Request) {
  const user = await getSession();
  const organizationId = user?.ownedOrgs?.[0]?.id;
  if (!organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month'); // e.g. "2024-03"
  const format = searchParams.get('format') || 'json';

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: 'Provide ?month=YYYY-MM' }, { status: 400 });
  }

  const parts = monthParam.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid ?month=YYYY-MM" }, { status: 400 });
  }

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59); // last day of month

  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      issueDate: { gte: from, lte: to },
      status: { notIn: ['DRAFT', 'CANCELLED'] },
    },
    include: {
      customer: true,
      items: true,
    },
    orderBy: { issueDate: 'asc' },
  });

  // ── Build GSTR-1 sections ─────────────────────────────────────────
  const b2b: any[] = []; // Registered buyers (have GSTIN)
  const b2c: any[] = []; // Unregistered buyers

  for (const inv of invoices) {
    const isInterState = organization.stateCode !== inv.placeOfSupply;

    const baseEntry = {
      invoice_number: inv.invoiceNumber,
      invoice_date: inv.issueDate.toLocaleDateString('en-IN'),
      place_of_supply: inv.placeOfSupply,
      supply_type: isInterState ? 'Inter-State' : 'Intra-State',
      taxable_value: inv.subTotal,
      cgst: inv.cgstTotal,
      sgst: inv.sgstTotal,
      igst: inv.igstTotal,
      invoice_value: inv.total,
    };

    if (inv.customer.gstin) {
      b2b.push({
        ...baseEntry,
        receiver_name: inv.customer.name,
        receiver_gstin: inv.customer.gstin,
      });
    } else {
      b2c.push({
        ...baseEntry,
        receiver_name: inv.customer.name,
      });
    }
  }

  const summary = {
    gstin: organization.gstin,
    legal_name: organization.name,
    period: monthParam,
    total_invoices: invoices.length,
    total_taxable_value: invoices.reduce((s, i) => s + Number(i.subTotal), 0),
    total_cgst: invoices.reduce((s, i) => s + Number(i.cgstTotal), 0),
    total_sgst: invoices.reduce((s, i) => s + Number(i.sgstTotal), 0),
    total_igst: invoices.reduce((s, i) => s + Number(i.igstTotal), 0),
    total_invoice_value: invoices.reduce((s, i) => s + Number(i.total), 0),
  };

  if (format === 'csv') {
    // Sanitize a string for CSV: escape quotes, wrap in quotes, and strip formula-injection prefixes
    const escapeCSV = (v: any) => {
      const val = v === null || v === undefined ? '' : String(v);
      const safe = val.replace(/^[=+\-@\t\r]/, "'$&"); // prepend ' to neutralize Excel formulas
      return `"${safe.replace(/"/g, '""')}"`;
    };

    const rows: string[] = [];
    rows.push('GSTR-1 Export');
    rows.push(`${escapeCSV(`GSTIN: ${organization.gstin || 'N/A'}`)},${escapeCSV(`Period: ${monthParam}`)}`);
    rows.push('');

    // B2B section
    rows.push('=== B2B Invoices (Registered Buyers) ===');
    rows.push('Invoice Number,Invoice Date,Receiver Name,Receiver GSTIN,Place of Supply,Supply Type,Taxable Value,CGST,SGST,IGST,Invoice Value');
    for (const r of b2b) {
      rows.push([
        escapeCSV(r.invoice_number), escapeCSV(r.invoice_date), escapeCSV(r.receiver_name), escapeCSV(r.receiver_gstin),
        escapeCSV(r.place_of_supply), escapeCSV(r.supply_type),
        Number(r.taxable_value).toFixed(2), Number(r.cgst).toFixed(2), Number(r.sgst).toFixed(2), Number(r.igst).toFixed(2), Number(r.invoice_value).toFixed(2),
      ].join(','));
    }

    rows.push('');
    rows.push('=== B2C Invoices (Unregistered Buyers) ===');
    rows.push('Invoice Number,Invoice Date,Receiver Name,Place of Supply,Supply Type,Taxable Value,CGST,SGST,IGST,Invoice Value');
    for (const r of b2c) {
      rows.push([
        escapeCSV(r.invoice_number), escapeCSV(r.invoice_date), escapeCSV(r.receiver_name),
        escapeCSV(r.place_of_supply), escapeCSV(r.supply_type),
        Number(r.taxable_value).toFixed(2), Number(r.cgst).toFixed(2), Number(r.sgst).toFixed(2), Number(r.igst).toFixed(2), Number(r.invoice_value).toFixed(2),
      ].join(','));
    }

    rows.push('');
    rows.push('=== Summary ===');
    rows.push(`Total Invoices,${summary.total_invoices}`);
    rows.push(`Total Taxable Value,${summary.total_taxable_value.toFixed(2)}`);
    rows.push(`Total CGST,${summary.total_cgst.toFixed(2)}`);
    rows.push(`Total SGST,${summary.total_sgst.toFixed(2)}`);
    rows.push(`Total IGST,${summary.total_igst.toFixed(2)}`);
    rows.push(`Total Invoice Value,${summary.total_invoice_value.toFixed(2)}`);

    const csvContent = rows.join('\n');
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="GSTR1_${organization.gstin || 'export'}_${monthParam}.csv"`,
      },
    });
  }

  return NextResponse.json({ summary, b2b, b2c });
}
