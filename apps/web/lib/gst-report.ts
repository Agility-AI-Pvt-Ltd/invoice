import { toRupees } from "@/lib/money";

export type GstrPeriod = {
  kind: "month" | "quarter";
  label: string;
  from: Date;
  to: Date;
};

export type GstrInvoiceRow = {
  invoice_number: string;
  invoice_date: string;
  receiver_name: string;
  receiver_gstin?: string;
  place_of_supply: string;
  supply_type: "Inter-State" | "Intra-State";
  tax_rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoice_value: number;
  reverse_charge: "N";
  invoice_type: "Regular";
};

export type GstrHsnRow = {
  hsn_code: string;
  description: string;
  uqc: string;
  quantity: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
  total_value: number;
  tax_rate: number;
};

export type GstrB2csRow = {
  place_of_supply: string;
  supply_type: "Inter-State" | "Intra-State";
  tax_rate: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
};

export type GstrLineItemRow = {
  invoice_number: string;
  invoice_date: string;
  receiver_name: string;
  receiver_gstin: string;
  place_of_supply: string;
  supply_type: "Inter-State" | "Intra-State";
  description: string;
  hsn_code: string;
  quantity: number;
  unit: string;
  tax_rate: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  line_total: number;
};

export type GstrReport = {
  summary: {
    gstin: string;
    legal_name: string;
    period: string;
    period_kind: "month" | "quarter";
    total_invoices: number;
    total_taxable_value: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_invoice_value: number;
  };
  b2b: GstrInvoiceRow[];
  b2cl: GstrInvoiceRow[];
  b2cs: GstrB2csRow[];
  b2c_detail: GstrInvoiceRow[];
  hsn: GstrHsnRow[];
  line_items: GstrLineItemRow[];
  documents: {
    from_number: string;
    to_number: string;
    total_issued: number;
  };
};

type InvoiceWithRelations = {
  invoiceNumber: string;
  issueDate: Date;
  placeOfSupply: string | null;
  subTotal: number | bigint;
  discountTotal: number | bigint;
  cgstTotal: number | bigint;
  sgstTotal: number | bigint;
  igstTotal: number | bigint;
  total: number | bigint;
  customer: { name: string; gstin: string | null };
  items: Array<{
    description: string;
    hsnCode: string | null;
    quantity: number | string | { toString(): string };
    unit: string | null;
    unitPrice: number | bigint;
    taxRate: number | string | { toString(): string };
    cgstAmount: number | bigint;
    sgstAmount: number | bigint;
    igstAmount: number | bigint;
    discount: number | bigint;
    total: number | bigint;
  }>;
};

const B2CL_THRESHOLD_RUPEES = 100_000;

export function parseGstrPeriod(params: {
  month?: string | null;
  quarter?: string | null;
}): GstrPeriod | { error: string } {
  const { month, quarter } = params;

  if (quarter) {
    const match = quarter.match(/^(\d{4})-Q([1-4])$/);
    if (!match) return { error: "Provide ?quarter=YYYY-Q1 through YYYY-Q4" };
    const year = Number(match[1]);
    const q = Number(match[2]);
    const startMonth = (q - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
    return { kind: "quarter", label: quarter, from, to };
  }

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const parts = month.split("-").map(Number);
    const y = parts[0];
    const m = parts[1];
    if (!y || !m || m < 1 || m > 12) return { error: "Invalid ?month=YYYY-MM" };
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59, 999);
    return { kind: "month", label: month, from, to };
  }

  return { error: "Provide ?month=YYYY-MM or ?quarter=YYYY-Q1" };
}

function resolvedInvoiceTotal(inv: InvoiceWithRelations): number {
  return (
    Number(inv.subTotal ?? 0) -
    Number(inv.discountTotal ?? 0) +
    Number(inv.cgstTotal ?? 0) +
    Number(inv.sgstTotal ?? 0) +
    Number(inv.igstTotal ?? 0)
  );
}

function taxableValue(inv: InvoiceWithRelations): number {
  return toRupees(Number(inv.subTotal ?? 0) - Number(inv.discountTotal ?? 0));
}

function dominantTaxRate(inv: InvoiceWithRelations): number {
  const rates = inv.items.map((i) => Number(i.taxRate));
  if (rates.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const r of rates) counts.set(r, (counts.get(r) ?? 0) + 1);
  let best = 0;
  let bestCount = 0;
  for (const [rate, count] of counts) {
    if (count > bestCount) {
      best = rate;
      bestCount = count;
    }
  }
  return best;
}

function lineTaxable(item: InvoiceWithRelations["items"][0]): number {
  const qty = Number(item.quantity);
  const gross = toRupees(Number(item.unitPrice) * qty);
  return gross - toRupees(Number(item.discount ?? 0));
}

export function buildGstrReport(
  invoices: InvoiceWithRelations[],
  organization: { gstin: string | null; name: string; stateCode: string | null },
  period: GstrPeriod,
): GstrReport {
  const b2b: GstrInvoiceRow[] = [];
  const b2cl: GstrInvoiceRow[] = [];
  const b2cDetail: GstrInvoiceRow[] = [];
  const lineItems: GstrLineItemRow[] = [];
  const hsnMap = new Map<string, GstrHsnRow>();
  const b2csMap = new Map<string, GstrB2csRow>();

  for (const inv of invoices) {
    const isInterState = organization.stateCode !== inv.placeOfSupply;
    const supplyType: "Inter-State" | "Intra-State" = isInterState
      ? "Inter-State"
      : "Intra-State";
    const pos = inv.placeOfSupply ?? organization.stateCode ?? "";
    const invoiceValue = toRupees(resolvedInvoiceTotal(inv));
    const taxable = taxableValue(inv);
    const taxRate = dominantTaxRate(inv);

    const row: GstrInvoiceRow = {
      invoice_number: inv.invoiceNumber,
      invoice_date: inv.issueDate.toLocaleDateString("en-IN"),
      receiver_name: inv.customer.name,
      receiver_gstin: inv.customer.gstin ?? undefined,
      place_of_supply: pos,
      supply_type: supplyType,
      tax_rate: taxRate,
      taxable_value: taxable,
      cgst: toRupees(Number(inv.cgstTotal)),
      sgst: toRupees(Number(inv.sgstTotal)),
      igst: toRupees(Number(inv.igstTotal)),
      invoice_value: invoiceValue,
      reverse_charge: "N",
      invoice_type: "Regular",
    };

    if (inv.customer.gstin) {
      b2b.push(row);
    } else if (isInterState && invoiceValue > B2CL_THRESHOLD_RUPEES) {
      b2cl.push(row);
    } else {
      b2cDetail.push(row);
      const b2csKey = `${pos}|${taxRate}|${supplyType}`;
      const existing = b2csMap.get(b2csKey);
      if (existing) {
        existing.taxable_value += taxable;
        existing.cgst += row.cgst;
        existing.sgst += row.sgst;
        existing.igst += row.igst;
      } else {
        b2csMap.set(b2csKey, {
          place_of_supply: pos,
          supply_type: supplyType,
          tax_rate: taxRate,
          taxable_value: taxable,
          igst: row.igst,
          cgst: row.cgst,
          sgst: row.sgst,
        });
      }
    }

    for (const item of inv.items) {
      const rate = Number(item.taxRate);
      const qty = Number(item.quantity);
      const itemTaxable = lineTaxable(item);
      const hsn = item.hsnCode || "NA";
      const hsnKey = `${hsn}|${rate}`;

      lineItems.push({
        invoice_number: inv.invoiceNumber,
        invoice_date: inv.issueDate.toLocaleDateString("en-IN"),
        receiver_name: inv.customer.name,
        receiver_gstin: inv.customer.gstin ?? "",
        place_of_supply: pos,
        supply_type: supplyType,
        description: item.description,
        hsn_code: hsn,
        quantity: qty,
        unit: item.unit ?? "NOS",
        tax_rate: rate,
        taxable_value: itemTaxable,
        cgst: toRupees(Number(item.cgstAmount)),
        sgst: toRupees(Number(item.sgstAmount)),
        igst: toRupees(Number(item.igstAmount)),
        line_total: toRupees(Number(item.total)),
      });

      const hsnRow = hsnMap.get(hsnKey);
      if (hsnRow) {
        hsnRow.quantity += qty;
        hsnRow.taxable_value += itemTaxable;
        hsnRow.cgst += toRupees(Number(item.cgstAmount));
        hsnRow.sgst += toRupees(Number(item.sgstAmount));
        hsnRow.igst += toRupees(Number(item.igstAmount));
        hsnRow.total_value += toRupees(Number(item.total));
      } else {
        hsnMap.set(hsnKey, {
          hsn_code: hsn,
          description: item.description,
          uqc: item.unit ?? "NOS",
          quantity: qty,
          taxable_value: itemTaxable,
          igst: toRupees(Number(item.igstAmount)),
          cgst: toRupees(Number(item.cgstAmount)),
          sgst: toRupees(Number(item.sgstAmount)),
          total_value: toRupees(Number(item.total)),
          tax_rate: rate,
        });
      }
    }
  }

  const invoiceNumbers = invoices.map((i) => i.invoiceNumber).sort();

  return {
    summary: {
      gstin: organization.gstin ?? "",
      legal_name: organization.name,
      period: period.label,
      period_kind: period.kind,
      total_invoices: invoices.length,
      total_taxable_value: invoices.reduce((s, i) => s + taxableValue(i), 0),
      total_cgst: toRupees(invoices.reduce((s, i) => s + Number(i.cgstTotal), 0)),
      total_sgst: toRupees(invoices.reduce((s, i) => s + Number(i.sgstTotal), 0)),
      total_igst: toRupees(invoices.reduce((s, i) => s + Number(i.igstTotal), 0)),
      total_invoice_value: invoices.reduce(
        (s, i) => s + toRupees(resolvedInvoiceTotal(i)),
        0,
      ),
    },
    b2b,
    b2cl,
    b2cs: Array.from(b2csMap.values()).sort((a, b) =>
      a.place_of_supply.localeCompare(b.place_of_supply),
    ),
    b2c_detail: b2cDetail,
    hsn: Array.from(hsnMap.values()).sort((a, b) =>
      a.hsn_code.localeCompare(b.hsn_code),
    ),
    line_items: lineItems,
    documents: {
      from_number: invoiceNumbers[0] ?? "",
      to_number: invoiceNumbers[invoiceNumbers.length - 1] ?? "",
      total_issued: invoices.length,
    },
  };
}

function escapeCSV(v: unknown): string {
  const val = v === null || v === undefined ? "" : String(v);
  const safe = val.replace(/^[=+\-@\t\r]/, "'$&");
  return `"${safe.replace(/"/g, '""')}"`;
}

function money(n: number): string {
  return Number(n).toFixed(2);
}

function csvRow(cells: unknown[]): string {
  return cells.map(escapeCSV).join(",");
}

export function buildGstrCsv(report: GstrReport): string {
  const { summary } = report;
  const rows: string[] = [];

  rows.push("GSTR-1 GST Report Export");
  rows.push(
    csvRow([
      "GSTIN",
      summary.gstin || "N/A",
      "Legal Name",
      summary.legal_name,
      "Period",
      summary.period,
      "Period Type",
      summary.period_kind,
    ]),
  );
  rows.push("");

  rows.push("=== Summary ===");
  rows.push(csvRow(["Field", "Value"]));
  rows.push(csvRow(["Total Invoices", summary.total_invoices]));
  rows.push(csvRow(["Total Taxable Value", money(summary.total_taxable_value)]));
  rows.push(csvRow(["Total CGST", money(summary.total_cgst)]));
  rows.push(csvRow(["Total SGST", money(summary.total_sgst)]));
  rows.push(csvRow(["Total IGST", money(summary.total_igst)]));
  rows.push(csvRow(["Total GST", money(summary.total_cgst + summary.total_sgst + summary.total_igst)]));
  rows.push(csvRow(["Total Invoice Value", money(summary.total_invoice_value)]));
  rows.push("");

  rows.push("=== B2B — Registered Buyers (Table 4A) ===");
  rows.push(
    csvRow([
      "Invoice Number",
      "Invoice Date",
      "Receiver Name",
      "Receiver GSTIN",
      "Place of Supply",
      "Supply Type",
      "Tax Rate (%)",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Invoice Value",
      "Reverse Charge",
      "Invoice Type",
    ]),
  );
  for (const r of report.b2b) {
    rows.push(
      csvRow([
        r.invoice_number,
        r.invoice_date,
        r.receiver_name,
        r.receiver_gstin,
        r.place_of_supply,
        r.supply_type,
        r.tax_rate,
        money(r.taxable_value),
        money(r.cgst),
        money(r.sgst),
        money(r.igst),
        money(r.invoice_value),
        r.reverse_charge,
        r.invoice_type,
      ]),
    );
  }
  rows.push("");

  rows.push("=== B2C Large — Inter-State > ₹1L (Table 5) ===");
  rows.push(
    csvRow([
      "Invoice Number",
      "Invoice Date",
      "Receiver Name",
      "Place of Supply",
      "Supply Type",
      "Tax Rate (%)",
      "Taxable Value",
      "IGST",
      "Invoice Value",
    ]),
  );
  for (const r of report.b2cl) {
    rows.push(
      csvRow([
        r.invoice_number,
        r.invoice_date,
        r.receiver_name,
        r.place_of_supply,
        r.supply_type,
        r.tax_rate,
        money(r.taxable_value),
        money(r.igst),
        money(r.invoice_value),
      ]),
    );
  }
  rows.push("");

  rows.push("=== B2C Small — Aggregated (Table 7) ===");
  rows.push(
    csvRow([
      "Place of Supply",
      "Supply Type",
      "Tax Rate (%)",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
    ]),
  );
  for (const r of report.b2cs) {
    rows.push(
      csvRow([
        r.place_of_supply,
        r.supply_type,
        r.tax_rate,
        money(r.taxable_value),
        money(r.cgst),
        money(r.sgst),
        money(r.igst),
      ]),
    );
  }
  rows.push("");

  rows.push("=== B2C Detail — All Unregistered Buyers ===");
  rows.push(
    csvRow([
      "Invoice Number",
      "Invoice Date",
      "Receiver Name",
      "Place of Supply",
      "Supply Type",
      "Tax Rate (%)",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Invoice Value",
    ]),
  );
  for (const r of report.b2c_detail) {
    rows.push(
      csvRow([
        r.invoice_number,
        r.invoice_date,
        r.receiver_name,
        r.place_of_supply,
        r.supply_type,
        r.tax_rate,
        money(r.taxable_value),
        money(r.cgst),
        money(r.sgst),
        money(r.igst),
        money(r.invoice_value),
      ]),
    );
  }
  rows.push("");

  rows.push("=== HSN Summary (Table 12) ===");
  rows.push(
    csvRow([
      "HSN/SAC",
      "Description",
      "UQC",
      "Total Quantity",
      "Tax Rate (%)",
      "Taxable Value",
      "IGST",
      "CGST",
      "SGST",
      "Total Value",
    ]),
  );
  for (const r of report.hsn) {
    rows.push(
      csvRow([
        r.hsn_code,
        r.description,
        r.uqc,
        r.quantity,
        r.tax_rate,
        money(r.taxable_value),
        money(r.igst),
        money(r.cgst),
        money(r.sgst),
        money(r.total_value),
      ]),
    );
  }
  rows.push("");

  rows.push("=== Line Item Detail ===");
  rows.push(
    csvRow([
      "Invoice Number",
      "Invoice Date",
      "Receiver Name",
      "Receiver GSTIN",
      "Place of Supply",
      "Supply Type",
      "Description",
      "HSN/SAC",
      "Quantity",
      "Unit",
      "Tax Rate (%)",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Line Total",
    ]),
  );
  for (const r of report.line_items) {
    rows.push(
      csvRow([
        r.invoice_number,
        r.invoice_date,
        r.receiver_name,
        r.receiver_gstin,
        r.place_of_supply,
        r.supply_type,
        r.description,
        r.hsn_code,
        r.quantity,
        r.unit,
        r.tax_rate,
        money(r.taxable_value),
        money(r.cgst),
        money(r.sgst),
        money(r.igst),
        money(r.line_total),
      ]),
    );
  }
  rows.push("");

  rows.push("=== Documents Issued (Table 13) ===");
  rows.push(csvRow(["From Invoice No", report.documents.from_number]));
  rows.push(csvRow(["To Invoice No", report.documents.to_number]));
  rows.push(csvRow(["Total Issued", report.documents.total_issued]));

  return rows.join("\n");
}

export function quarterOptions(count = 8): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  let year = now.getFullYear();
  let quarter = Math.floor(now.getMonth() / 3) + 1;

  for (let i = 0; i < count; i++) {
    const value = `${year}-Q${quarter}`;
    const startMonth = (quarter - 1) * 3;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `Q${quarter} ${year} (${monthNames[startMonth]}–${monthNames[startMonth + 2]} ${year})`;
    options.push({ value, label });
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }
  return options;
}
