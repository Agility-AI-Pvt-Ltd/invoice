/**
 * Fix invoices stored in rupees so UI (÷100) shows correctly.
 *
 * Usage:
 *   npx tsx apps/web/scripts/fix-rupee-to-paise.ts --dry-run
 *   npx tsx apps/web/scripts/fix-rupee-to-paise.ts
 */
import "dotenv/config";
import pg from "pg";

const CUTOFF = "2026-06-08T00:00:00+05:30";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const forceAll = process.argv.includes("--all");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const pool = new pg.Pool({ connectionString: url, max: 1, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    const where = forceAll
      ? "TRUE"
      : `"createdAt" < $1::timestamptz`;
    const params = forceAll ? [] : [CUTOFF];

    const sample = await client.query(
      `SELECT id, "invoiceNumber", total, "createdAt"
       FROM "Invoice"
       WHERE ${where}
       ORDER BY "createdAt" ASC
       LIMIT 10`,
      params,
    );

    const counts = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM "Invoice" WHERE ${where}) AS invoices,
         (SELECT COUNT(*)::int FROM "InvoiceItem" ii
            JOIN "Invoice" i ON i.id = ii."invoiceId" WHERE ${forceAll ? "TRUE" : 'i."createdAt" < $1::timestamptz'}) AS items,
         (SELECT COUNT(*)::int FROM "Payment" p
            JOIN "Invoice" i ON i.id = p."invoiceId" WHERE ${forceAll ? "TRUE" : 'i."createdAt" < $1::timestamptz'}) AS payments`,
      params,
    );

    console.log(
      JSON.stringify(
        {
          dryRun,
          forceAll,
          cutoff: CUTOFF,
          counts: counts.rows[0],
          sample: sample.rows.map((r) => ({
            invoiceNumber: r.invoiceNumber,
            createdAt: r.createdAt,
            totalBefore: r.total,
            totalAfter: r.total * 100,
          })),
        },
        null,
        2,
      ),
    );

    if (dryRun) return;

    const invCount = counts.rows[0]?.invoices ?? 0;
    if (invCount === 0) {
      console.log("Nothing to migrate.");
      return;
    }

    await client.query("BEGIN");

    await client.query(
      `UPDATE "Invoice" SET
         "subTotal" = "subTotal" * 100,
         "cgstTotal" = "cgstTotal" * 100,
         "sgstTotal" = "sgstTotal" * 100,
         "igstTotal" = "igstTotal" * 100,
         "discountTotal" = "discountTotal" * 100,
         total = total * 100
       WHERE ${where}`,
      params,
    );

    await client.query(
      `UPDATE "InvoiceItem" ii SET
         "unitPrice" = ii."unitPrice" * 100,
         "cgstAmount" = ii."cgstAmount" * 100,
         "sgstAmount" = ii."sgstAmount" * 100,
         "igstAmount" = ii."igstAmount" * 100,
         discount = ii.discount * 100,
         total = ii.total * 100
       FROM "Invoice" i
       WHERE ii."invoiceId" = i.id
         AND ${forceAll ? "TRUE" : 'i."createdAt" < $1::timestamptz'}`,
      params,
    );

    await client.query(
      `UPDATE "Payment" p SET
         amount = p.amount * 100
       FROM "Invoice" i
       WHERE p."invoiceId" = i.id
         AND ${forceAll ? "TRUE" : 'i."createdAt" < $1::timestamptz'}`,
      params,
    );

    await client.query(
      `UPDATE "RecurringInvoice" SET
         "subTotal" = "subTotal" * 100,
         "cgstTotal" = "cgstTotal" * 100,
         "sgstTotal" = "sgstTotal" * 100,
         "igstTotal" = "igstTotal" * 100,
         "discountTotal" = "discountTotal" * 100,
         total = total * 100
       WHERE ${where}`,
      params,
    );

    await client.query(
      `UPDATE "RecurringInvoiceItem" ri SET
         "unitPrice" = ri."unitPrice" * 100,
         "cgstAmount" = ri."cgstAmount" * 100,
         "sgstAmount" = ri."sgstAmount" * 100,
         "igstAmount" = ri."igstAmount" * 100,
         discount = ri.discount * 100,
         total = ri.total * 100
       FROM "RecurringInvoice" r
       WHERE ri."recurringInvoiceId" = r.id
         AND ${forceAll ? "TRUE" : 'r."createdAt" < $1::timestamptz'}`,
      params,
    );

    await client.query("COMMIT");
    console.log("Migration applied successfully.");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
