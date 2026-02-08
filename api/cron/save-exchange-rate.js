/**
 * Cron Job: Save Month-End Exchange Rate
 * Runs on the last day of each month at 23:00 UTC
 *
 * Vercel Cron: configured in vercel.json
 */

const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/**
 * Check if today is the last day of the month
 */
function isLastDayOfMonth() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.getUTCMonth() !== now.getUTCMonth();
}

/**
 * Get the last day of the current month
 */
function getLastDayOfCurrentMonth() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-indexed
  const lastDay = new Date(year, month, 0).getDate();
  return {
    yearMonth: `${year}-${String(month).padStart(2, '0')}`,
    date: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  };
}

/**
 * Fetch exchange rate from Frankfurter API
 */
async function fetchExchangeRate(date) {
  const response = await fetch(`https://api.frankfurter.app/${date}?from=USD&to=JPY`);
  const data = await response.json();

  if (data.rates && data.rates.JPY) {
    return data.rates.JPY;
  }

  throw new Error('Failed to fetch exchange rate');
}

module.exports = async function handler(req, res) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow manual trigger from admin with admin token
    if (!process.env.ADMIN_TOKEN || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const { yearMonth, date } = getLastDayOfCurrentMonth();

    console.log(`Fetching exchange rate for ${date} (${yearMonth})`);

    // Fetch the rate
    const rate = await fetchExchangeRate(date);

    console.log(`Exchange rate for ${date}: $1 = ¥${rate}`);

    // Save to database
    const dbPool = getPool();
    await dbPool.query(`
      INSERT INTO exchange_rates (year_month, usd_jpy, rate_date, source)
      VALUES ($1, $2, $3, 'ECB (Frankfurter API)')
      ON CONFLICT (year_month) DO UPDATE SET
        usd_jpy = EXCLUDED.usd_jpy,
        rate_date = EXCLUDED.rate_date,
        fetched_at = NOW()
    `, [yearMonth, rate, date]);

    console.log(`Saved exchange rate for ${yearMonth}`);

    return res.json({
      success: true,
      yearMonth,
      date,
      rate,
      message: `Exchange rate saved: $1 = ¥${rate}`
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to save exchange rate'
    });
  }
};
