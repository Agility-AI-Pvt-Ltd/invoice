const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Multiplying monetary values by 100...");

  // Product
  await prisma.$executeRawUnsafe(`UPDATE "Product" SET "price" = "price" * 100`);

  // Invoice
  await prisma.$executeRawUnsafe(`UPDATE "Invoice" SET "subTotal" = "subTotal" * 100, "cgstTotal" = "cgstTotal" * 100, "sgstTotal" = "sgstTotal" * 100, "igstTotal" = "igstTotal" * 100, "discountTotal" = "discountTotal" * 100, "total" = "total" * 100`);

  // InvoiceItem
  await prisma.$executeRawUnsafe(`UPDATE "InvoiceItem" SET "unitPrice" = "unitPrice" * 100, "cgstAmount" = "cgstAmount" * 100, "sgstAmount" = "sgstAmount" * 100, "igstAmount" = "igstAmount" * 100, "discount" = "discount" * 100, "total" = "total" * 100`);

  // Payment
  await prisma.$executeRawUnsafe(`UPDATE "Payment" SET "amount" = "amount" * 100`);

  // RecurringInvoice
  await prisma.$executeRawUnsafe(`UPDATE "RecurringInvoice" SET "subTotal" = "subTotal" * 100, "cgstTotal" = "cgstTotal" * 100, "sgstTotal" = "sgstTotal" * 100, "igstTotal" = "igstTotal" * 100, "discountTotal" = "discountTotal" * 100, "total" = "total" * 100`);

  // RecurringInvoiceItem
  await prisma.$executeRawUnsafe(`UPDATE "RecurringInvoiceItem" SET "unitPrice" = "unitPrice" * 100, "cgstAmount" = "cgstAmount" * 100, "sgstAmount" = "sgstAmount" * 100, "igstAmount" = "igstAmount" * 100, "discount" = "discount" * 100, "total" = "total" * 100`);

  // Deal
  await prisma.$executeRawUnsafe(`UPDATE "Deal" SET "value" = "value" * 100 WHERE "value" IS NOT NULL`);

  // ExpenseLedgerEntry
  await prisma.$executeRawUnsafe(`UPDATE "ExpenseLedgerEntry" SET "amount" = "amount" * 100`);

  // ExpenseBudget
  await prisma.$executeRawUnsafe(`UPDATE "ExpenseBudget" SET "limitAmount" = "limitAmount" * 100`);

  console.log("Done.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
