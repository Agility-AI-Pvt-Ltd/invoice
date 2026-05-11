const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Populating addresses for existing invoices...');
  
  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
    },
  });

  console.log(`Found ${invoices.length} invoices to check.`);

  let updatedCount = 0;

  for (const invoice of invoices) {
    const billingAddress = invoice.billingAddress || invoice.customer.address || '';
    const shippingAddress = invoice.shippingAddress || billingAddress;
    const shippingName = invoice.shippingName || invoice.customer.name;

    // Update if any of these are missing or if we want to ensure consistency
    if (!invoice.billingAddress || !invoice.shippingAddress || !invoice.shippingName) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          billingAddress,
          shippingAddress,
          shippingName,
        },
      });
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} invoices.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
