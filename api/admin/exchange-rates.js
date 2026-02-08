/**
 * Admin Exchange Rates API
 * GET /api/admin/exchange-rates - Get stored exchange rates
 * POST /api/admin/exchange-rates - Manually save exchange rate for a month
 *
 * Vercel Serverless Function
 */

const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

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
 * Get last day of a month
 */
function getLastDayOfMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
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

  throw new Error('Failed to fetch exchange rate from API');
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get all stored exchange rates
      const { year_month } = req.query;

      if (year_month) {
        // Get specific month's rate
        const result = await dbPool.query(
          'SELECT * FROM exchange_rates WHERE year_month = $1',
          [year_month]
        );

        if (result.rows.length === 0) {
          return res.json({
            success: true,
            rate: null,
            message: 'No stored rate for this month'
          });
        }

        return res.json({
          success: true,
          rate: {
            year_month: result.rows[0].year_month,
            usd_jpy: parseFloat(result.rows[0].usd_jpy),
            rate_date: result.rows[0].rate_date,
            source: result.rows[0].source
          }
        });
      }

      // Get all rates
      const result = await dbPool.query(
        'SELECT * FROM exchange_rates ORDER BY year_month DESC LIMIT 24'
      );

      return res.json({
        success: true,
        rates: result.rows.map(row => ({
          year_month: row.year_month,
          usd_jpy: parseFloat(row.usd_jpy),
          rate_date: row.rate_date,
          source: row.source
        }))
      });

    } else if (req.method === 'POST') {
      // Manually save exchange rate for a specific month
      const { year_month } = req.body;

      if (!year_month || !/^\d{4}-\d{2}$/.test(year_month)) {
        return res.status(400).json({
          error: { message: 'year_month is required (format: YYYY-MM)' }
        });
      }

      const rateDate = getLastDayOfMonth(year_month);

      // Fetch rate from API
      const rate = await fetchExchangeRate(rateDate);

      // Save to database
      await dbPool.query(`
        INSERT INTO exchange_rates (year_month, usd_jpy, rate_date, source)
        VALUES ($1, $2, $3, 'ECB (Frankfurter API)')
        ON CONFLICT (year_month) DO UPDATE SET
          usd_jpy = EXCLUDED.usd_jpy,
          rate_date = EXCLUDED.rate_date,
          fetched_at = NOW()
      `, [year_month, rate, rateDate]);

      return res.json({
        success: true,
        rate: {
          year_month,
          usd_jpy: rate,
          rate_date: rateDate,
          source: 'ECB (Frankfurter API)'
        },
        message: `Exchange rate saved: $1 = ¥${rate.toFixed(2)} (${rateDate})`
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Exchange rates API error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
};
