import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';

const db = await mysql.createConnection({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'agentflow',
  password: process.env.DB_PASSWORD ?? 'agentflow_dev_password',
  database: process.env.DB_NAME ?? 'agentflow'
});

try {
  const schema = await fs.readFile(new URL('../../sql/schema.sql', import.meta.url), 'utf8');
  await db.query(schema);
  console.log('AgentFlow database initialized.');
} finally {
  await db.end();
}
