import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

type InvoiceItem = {
  description: string;
  hsnCode?: string | null;
  // At runtime these often come from Prisma Decimal – keep type wide and
  // coerce to numbers/strings right before rendering into <Text>.
  quantity: number | string | { toNumber?: () => number };
  unitPrice: number | string | { toNumber?: () => number };
  taxRate: number | string | { toNumber?: () => number };
  cgstAmount: number | string | { toNumber?: () => number };
  sgstAmount: number | string | { toNumber?: () => number };
  igstAmount: number | string | { toNumber?: () => number };
  total: number | string | { toNumber?: () => number };
};

type InvoiceData = {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  notes?: string | null;
  customerDetails?: string | null;
  placeOfSupply?: string | null;
  total: number;
  items: InvoiceItem[];

  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    gstin?: string | null;
    stateCode?: string | null;
  };
  organization: {
    name: string;
    address?: string | null;
    gstin?: string | null;
    stateCode?: string | null;
  };
};

// Normalise any numeric-like value (including Prisma Decimal) to a JS number
const toNumber = (value: any): number => {
  if (value == null || Number.isNaN(value)) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber();
  }
  return Number(value) || 0;
};

const fmt = (n: any) => {
  const num = toNumber(n);
  return `₹${num.toFixed(2)}`;
};
const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── MODERN TEMPLATE ────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", fontWeight: 700 },
  ],
});

// ─── MODERN TEMPLATE ────────────────────────────────────────────────
const modernStyles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: "#1a1a1a", backgroundColor: "#ffffff", padding: 0 },
  header: { backgroundColor: "#111827", padding: "28 36 20 36" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { fontSize: 18, fontFamily: "Inter", fontWeight: 700, color: "#ffffff", letterSpacing: 1 },
  invoiceLabel: { fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 2 },
  invoiceNum: { fontSize: 14, fontFamily: "Inter", fontWeight: 700, color: "#ffffff", textAlign: "right" },
  headerMeta: { color: "#d1d5db", textAlign: "right", marginTop: 4, fontSize: 8 },
  body: { padding: "24 36" },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  colLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
  colVal: { fontSize: 9, color: "#111827", lineHeight: 1.6 },
  colValBold: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: "#111827", marginBottom: 3 },
  tableHead: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "8 10", borderRadius: 4 },
  tableHeadCell: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter", fontWeight: 700 },
  tableRow: { flexDirection: "row", padding: "9 10", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableCell: { fontSize: 9, color: "#374151" },
  totalsBox: { alignSelf: "flex-end", width: 220, marginTop: 20, borderTopWidth: 2, borderTopColor: "#111827", paddingTop: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontSize: 9, color: "#6b7280" },
  totalVal: { fontSize: 9, color: "#111827" },
  grandLabel: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: "#111827" },
  grandVal: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: "#111827" },
  notes: { marginTop: 24, padding: "12 14", backgroundColor: "#f9fafb", borderRadius: 4 },
  notesLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 9, color: "#6b7280", lineHeight: 1.6 },
  footer: { marginTop: 32, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
});

// ─── CLASSIC TEMPLATE ───────────────────────────────────────────────
const classicStyles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: "#1a1a1a", backgroundColor: "#ffffff", padding: "36 40" },
  outerBorder: { borderWidth: 2, borderColor: "#1a1a1a", padding: "0" },
  headerBox: { borderBottomWidth: 2, borderBottomColor: "#1a1a1a", padding: "20 24", flexDirection: "row", justifyContent: "space-between" },
  logo: { fontSize: 16, fontFamily: "Inter", fontWeight: 700, color: "#1a1a1a" },
  invoiceRight: { textAlign: "right" },
  invoiceTitle: { fontSize: 22, fontFamily: "Inter", fontWeight: 700, color: "#1a1a1a", letterSpacing: 2 },
  invoiceNum: { fontSize: 9, color: "#6b7280", marginTop: 4 },
  body: { padding: "20 24" },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  colLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "Inter", fontWeight: 700 },
  colVal: { fontSize: 9, color: "#1a1a1a", lineHeight: 1.6 },
  colValBold: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, marginBottom: 2 },
  tableHead: { flexDirection: "row", borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: "#1a1a1a", padding: "6 0" },
  tableHeadCell: { fontSize: 7, fontFamily: "Inter", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", padding: "8 0", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db" },
  tableCell: { fontSize: 9, color: "#374151" },
  totalsBox: { alignSelf: "flex-end", width: 200, marginTop: 20, borderTopWidth: 1.5, borderTopColor: "#1a1a1a", paddingTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalLabel: { fontSize: 9, color: "#6b7280" },
  totalVal: { fontSize: 9 },
  grandLabel: { fontSize: 12, fontFamily: "Inter", fontWeight: 700 },
  grandVal: { fontSize: 12, fontFamily: "Inter", fontWeight: 700 },
  notes: { marginTop: 20, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 },
  notesLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "Inter", fontWeight: 700 },
  notesText: { fontSize: 9, color: "#6b7280", lineHeight: 1.6 },
});

// ─── MINIMAL TEMPLATE ───────────────────────────────────────────────
const minimalStyles = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: "#1a1a1a", backgroundColor: "#ffffff", padding: "48 52" },
  invoiceWord: { fontSize: 32, fontFamily: "Inter", fontWeight: 700, color: "#e5e7eb", letterSpacing: 2, marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 16 },
  logo: { fontSize: 13, fontFamily: "Inter", fontWeight: 700, color: "#1a1a1a" },
  invoiceNum: { fontSize: 10, color: "#6b7280" },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  colLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 },
  colVal: { fontSize: 9, color: "#374151", lineHeight: 1.7 },
  colValBold: { fontSize: 10, fontFamily: "Inter", fontWeight: 700, color: "#111827", marginBottom: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginBottom: 12 },
  tableHead: { flexDirection: "row", marginBottom: 8 },
  tableHeadCell: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableCell: { fontSize: 9, color: "#374151" },
  totalsBox: { alignSelf: "flex-end", width: 200, marginTop: 24 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  totalLabel: { fontSize: 9, color: "#9ca3af" },
  totalVal: { fontSize: 9, color: "#374151" },
  dividerLight: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6", marginBottom: 8 },
  grandLabel: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: "#111827" },
  grandVal: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, color: "#111827" },
  notes: { marginTop: 28 },
  notesLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 },
  notesText: { fontSize: 9, color: "#6b7280", lineHeight: 1.7 },
});

// ─── Shared helpers ──────────────────────────────────────────────────
function LineItemsTable({ items, s, isInterState }: { items: InvoiceItem[]; s: any; isInterState: boolean }) {
  const colW = { desc: "38%", hsn: "12%", qty: "8%", price: "14%", tax: "12%", amt: "16%" };
  return (
    <View>
      <View style={s.tableHead}>
        <Text style={[s.tableHeadCell, { width: colW.desc }]}>Description</Text>
        <Text style={[s.tableHeadCell, { width: colW.hsn }]}>HSN</Text>
        <Text style={[s.tableHeadCell, { width: colW.qty, textAlign: "center" }]}>Qty</Text>
        <Text style={[s.tableHeadCell, { width: colW.price, textAlign: "right" }]}>Rate</Text>
        <Text style={[s.tableHeadCell, { width: colW.tax, textAlign: "center" }]}>GST%</Text>
        <Text style={[s.tableHeadCell, { width: colW.amt, textAlign: "right" }]}>Amount</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={s.tableRow}>
          <Text style={[s.tableCell, { width: colW.desc }]}>{item.description}</Text>
          <Text style={[s.tableCell, { width: colW.hsn, color: "#9ca3af" }]}>{item.hsnCode || "—"}</Text>
          <Text style={[s.tableCell, { width: colW.qty, textAlign: "center" }]}>{String(toNumber(item.quantity))}</Text>
          <Text style={[s.tableCell, { width: colW.price, textAlign: "right" }]}>{fmt(item.unitPrice)}</Text>
          <Text style={[s.tableCell, { width: colW.tax, textAlign: "center", color: "#6b7280" }]}>
            {toNumber(item.taxRate)}%
          </Text>
          <Text style={[s.tableCell, { width: colW.amt, textAlign: "right", fontFamily: "Inter", fontWeight: 700 }]}>
            {fmt(toNumber(item.quantity) * toNumber(item.unitPrice))}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TaxSummaryTable({ items, s, isInterState }: { items: InvoiceItem[]; s: any; isInterState: boolean }) {
  // Group by tax rate
  const summary = items.reduce((acc: any, item) => {
    const rate = toNumber(item.taxRate);
    const base = toNumber(item.quantity) * toNumber(item.unitPrice);
    const tax = (base * rate) / 100;
    if (!acc[rate]) acc[rate] = { rate, taxable: 0, tax: 0 };
    acc[rate].taxable += base;
    acc[rate].tax += tax;
    return acc;
  }, {});

  const rates = Object.values(summary).sort((a: any, b: any) => a.rate - b.rate);
  const colW = isInterState 
    ? { rate: "20%", taxable: "40%", igst: "40%" }
    : { rate: "20%", taxable: "30%", cgst: "25%", sgst: "25%" };

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={[s.colLabel, { marginBottom: 8 }]}>Tax Breakdown</Text>
      <View style={[s.tableHead, { backgroundColor: "#f9fafb" }]}>
        <Text style={[s.tableHeadCell, { width: colW.rate }]}>GST %</Text>
        <Text style={[s.tableHeadCell, { width: colW.taxable, textAlign: "right" }]}>Taxable Val</Text>
        {isInterState ? (
          <Text style={[s.tableHeadCell, { width: colW.igst, textAlign: "right" }]}>IGST Amount</Text>
        ) : (
          <>
            <Text style={[s.tableHeadCell, { width: colW.cgst, textAlign: "right" }]}>CGST Amount</Text>
            <Text style={[s.tableHeadCell, { width: colW.sgst, textAlign: "right" }]}>SGST Amount</Text>
          </>
        )}
      </View>
      {rates.map((r: any, i) => (
        <View key={i} style={s.tableRow}>
          <Text style={[s.tableCell, { width: colW.rate }]}>{r.rate}%</Text>
          <Text style={[s.tableCell, { width: colW.taxable, textAlign: "right" }]}>{fmt(r.taxable)}</Text>
          {isInterState ? (
            <Text style={[s.tableCell, { width: colW.igst, textAlign: "right" }]}>{fmt(r.tax)}</Text>
          ) : (
            <>
              <Text style={[s.tableCell, { width: colW.cgst, textAlign: "right" }]}>{fmt(r.tax / 2)}</Text>
              <Text style={[s.tableCell, { width: colW.sgst, textAlign: "right" }]}>{fmt(r.tax / 2)}</Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}


// ─── MODERN PDF ──────────────────────────────────────────────────────
function ModernPDF({ inv }: { inv: InvoiceData }) {
  const s = modernStyles;
  const hasIgst = Number(inv.igstTotal) > 0;
  const hasCgst = Number(inv.cgstTotal) > 0;
  const orgState = (inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const supplyState = (inv.placeOfSupply || inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const isInterState = hasIgst ? true : hasCgst ? false : (!!orgState && !!supplyState && orgState !== supplyState);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.logo}>{inv.organization.name}</Text>
              <Text style={s.invoiceLabel}>Tax Invoice</Text>
            </View>
            <View>
              <Text style={s.invoiceNum}>{inv.invoiceNumber}</Text>
              <Text style={s.headerMeta}>Issued: {fmtDate(inv.issueDate)}</Text>
              <Text style={s.headerMeta}>Due: {fmtDate(inv.dueDate)}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          <View style={s.twoCol}>
            <View style={{ width: "45%" }}>
              <Text style={s.colLabel}>Billed To</Text>
              <Text style={s.colValBold}>{inv.customer.name}</Text>
              {inv.customer.gstin && <Text style={s.colVal}>GSTIN: {inv.customer.gstin}</Text>}
              {inv.customer.address && <Text style={s.colVal}>{inv.customer.address}</Text>}
              {inv.customer.email && <Text style={s.colVal}>{inv.customer.email}</Text>}
              {inv.customerDetails && (
                <Text style={[s.colVal, { marginTop: 8, color: "#4b5563", fontSize: 8, fontStyle: "italic" }]}>
                  {inv.customerDetails}
                </Text>
              )}
            </View>
            <View style={{ width: "45%" }}>
              <Text style={s.colLabel}>From</Text>
              <Text style={s.colValBold}>{inv.organization.name}</Text>
              {inv.organization.gstin && <Text style={s.colVal}>GSTIN: {inv.organization.gstin}</Text>}
              {inv.organization.address && <Text style={s.colVal}>{inv.organization.address}</Text>}
              <Text style={[s.colVal, { marginTop: 10, color: "#6b7280" }]}>
                Place of Supply: {inv.placeOfSupply || inv.organization.stateCode}
              </Text>
            </View>
          </View>

          <LineItemsTable items={inv.items} s={s} isInterState={isInterState} />
          <TaxSummaryTable items={inv.items} s={s} isInterState={isInterState} />

          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(inv.subTotal)}</Text></View>
            {isInterState
              ? <View style={s.totalRow}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(inv.igstTotal)}</Text></View>
              : <>
                  <View style={s.totalRow}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(inv.cgstTotal)}</Text></View>
                  <View style={s.totalRow}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(inv.sgstTotal)}</Text></View>
                </>
            }
            <View style={[s.totalRow, { borderTopWidth: 1.5, borderTopColor: "#111827", marginTop: 8, paddingTop: 8 }]}>
              <Text style={s.grandLabel}>Total Due</Text>
              <Text style={s.grandVal}>{fmt(inv.total)}</Text>
            </View>
          </View>

          {inv.notes && (
            <View style={s.notes}>
              <Text style={s.notesLabel}>Notes</Text>
              <Text style={s.notesText}>{inv.notes}</Text>
            </View>
          )}

          <View style={s.footer}>
            <Text style={s.footerText}>Thank you for your business.</Text>
            <Text style={s.footerText}>Generated by Invoicely</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── CLASSIC PDF ─────────────────────────────────────────────────────
function ClassicPDF({ inv }: { inv: InvoiceData }) {
  const s = classicStyles;
  const hasIgst = Number(inv.igstTotal) > 0;
  const hasCgst = Number(inv.cgstTotal) > 0;
  const orgState = (inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const supplyState = (inv.placeOfSupply || inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const isInterState = hasIgst ? true : hasCgst ? false : (!!orgState && !!supplyState && orgState !== supplyState);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.outerBorder}>
          <View style={s.headerBox}>
            <View>
              <Text style={s.logo}>{inv.organization.name}</Text>
              {inv.organization.gstin && <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 3 }}>GSTIN: {inv.organization.gstin}</Text>}
              {inv.organization.address && <Text style={{ fontSize: 8, color: "#6b7280" }}>{inv.organization.address}</Text>}
            </View>
            <View style={s.invoiceRight}>
              <Text style={s.invoiceTitle}>INVOICE</Text>
              <Text style={s.invoiceNum}>#{inv.invoiceNumber}</Text>
              <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 6 }}>Issued: {fmtDate(inv.issueDate)}</Text>
              <Text style={{ fontSize: 8, color: "#6b7280" }}>Due: {fmtDate(inv.dueDate)}</Text>
            </View>
          </View>

          <View style={s.body}>
            <View style={s.twoCol}>
              <View style={{ width: "45%" }}>
                <Text style={s.colLabel}>Bill To</Text>
                <Text style={s.colValBold}>{inv.customer.name}</Text>
                {inv.customer.gstin && <Text style={s.colVal}>GSTIN: {inv.customer.gstin}</Text>}
                {inv.customer.address && <Text style={s.colVal}>{inv.customer.address}</Text>}
                {inv.customer.email && <Text style={s.colVal}>{inv.customer.email}</Text>}
                {inv.customerDetails && (
                  <Text style={[s.colVal, { marginTop: 6, color: "#6b7280", fontStyle: "italic", fontSize: 8 }]}>
                    {inv.customerDetails}
                  </Text>
                )}
              </View>
              <View style={{ width: "45%" }}>
                <Text style={s.colLabel}>Payment Details</Text>
                <Text style={[s.colVal, { color: "#6b7280" }]}>Place of Supply: {inv.placeOfSupply}</Text>
                <Text style={[s.colVal, { color: "#6b7280", marginTop: 4 }]}>Status: {inv.status}</Text>
              </View>
            </View>

            <LineItemsTable items={inv.items} s={s} isInterState={isInterState} />
            <TaxSummaryTable items={inv.items} s={s} isInterState={isInterState} />

            <View style={s.totalsBox}>
              <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(inv.subTotal)}</Text></View>
              {isInterState
                ? <View style={s.totalRow}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(inv.igstTotal)}</Text></View>
                : <>
                    <View style={s.totalRow}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(inv.cgstTotal)}</Text></View>
                    <View style={s.totalRow}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(inv.sgstTotal)}</Text></View>
                  </>
              }
              <View style={[s.totalRow, { borderTopWidth: 1.5, borderTopColor: "#1a1a1a", marginTop: 8, paddingTop: 8 }]}>
                <Text style={s.grandLabel}>Total Due</Text>
                <Text style={s.grandVal}>{fmt(inv.total)}</Text>
              </View>
            </View>

            {inv.notes && (
              <View style={s.notes}>
                <Text style={s.notesLabel}>Notes & Terms</Text>
                <Text style={s.notesText}>{inv.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── MINIMAL PDF ─────────────────────────────────────────────────────
function MinimalPDF({ inv }: { inv: InvoiceData }) {
  const s = minimalStyles;
  const hasIgst = Number(inv.igstTotal) > 0;
  const hasCgst = Number(inv.cgstTotal) > 0;
  const orgState = (inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const supplyState = (inv.placeOfSupply || inv.organization.stateCode || "").match(/\d+/)?.[0] || "";
  const isInterState = hasIgst ? true : hasCgst ? false : (!!orgState && !!supplyState && orgState !== supplyState);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.invoiceWord}>INVOICE</Text>
        <View style={s.headerRow}>
          <View>
            <Text style={s.logo}>{inv.organization.name}</Text>
            {inv.organization.gstin && <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 2 }}>GSTIN: {inv.organization.gstin}</Text>}
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={s.invoiceNum}>#{inv.invoiceNumber}</Text>
            <Text style={{ fontSize: 8, color: "#9ca3af", marginTop: 3 }}>{fmtDate(inv.issueDate)}</Text>
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={{ width: "45%" }}>
            <Text style={s.colLabel}>Bill To</Text>
            <Text style={s.colValBold}>{inv.customer.name}</Text>
            {inv.customer.gstin && <Text style={s.colVal}>GSTIN: {inv.customer.gstin}</Text>}
            {inv.customer.email && <Text style={s.colVal}>{inv.customer.email}</Text>}
            {inv.customer.address && <Text style={s.colVal}>{inv.customer.address}</Text>}
            {inv.customerDetails && (
              <Text style={[s.colVal, { marginTop: 6, color: "#9ca3af", fontStyle: "italic", fontSize: 8 }]}>
                {inv.customerDetails}
              </Text>
            )}
          </View>
          <View style={{ width: "40%", textAlign: "right" }}>
            <Text style={s.colLabel}>Due Date</Text>
            <Text style={[s.colValBold, { textAlign: "right" }]}>{fmtDate(inv.dueDate)}</Text>
          </View>
        </View>

        <View style={s.divider} />
        <LineItemsTable items={inv.items} s={s} isInterState={isInterState} />
        <TaxSummaryTable items={inv.items} s={s} isInterState={isInterState} />

        <View style={s.totalsBox}>
          <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(inv.subTotal)}</Text></View>
          {isInterState
            ? <View style={s.totalRow}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(inv.igstTotal)}</Text></View>
            : <>
                <View style={s.totalRow}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(inv.cgstTotal)}</Text></View>
                <View style={s.totalRow}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(inv.sgstTotal)}</Text></View>
              </>
          }
          <View style={s.dividerLight} />
          <View style={s.totalRow}>
            <Text style={s.grandLabel}>Total</Text>
            <Text style={s.grandVal}>{fmt(inv.total)}</Text>
          </View>
        </View>

        {inv.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{inv.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

// ─── Selector ────────────────────────────────────────────────────────
export function buildPDF(inv: InvoiceData, template: string) {
  switch (template) {
    case "classic": return <ClassicPDF inv={inv} />;
    case "minimal": return <MinimalPDF inv={inv} />;
    default:        return <ModernPDF inv={inv} />;
  }
}
