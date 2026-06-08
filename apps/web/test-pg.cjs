const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_5GRaXPk1ilOF@ep-long-art-apaqmnrm-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  const res = await client.query('SELECT "invoiceNumber", "issueDate", "total", "status" FROM "Invoice"');
  console.log(res.rows);
  await client.end();
}
main();
