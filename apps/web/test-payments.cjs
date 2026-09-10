const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_5GRaXPk1ilOF@ep-long-art-apaqmnrm-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });
  await client.connect();
  const res = await client.query('SELECT "id", "amount", "paymentDate" FROM "Payment" ORDER BY "paymentDate" DESC LIMIT 5');
  console.log(res.rows);
  await client.end();
}
main();
