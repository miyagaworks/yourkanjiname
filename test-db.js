const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

test();
