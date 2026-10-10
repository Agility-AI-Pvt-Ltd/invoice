import { prisma } from '@repo/db';

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: {
      invoiceNumber: true,
      issueDate: true,
      total: true,
      status: true
    }
  });
  console.log(invoices);
}
main();
