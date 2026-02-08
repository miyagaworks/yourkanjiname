/**
 * Admin Salesperson Detail API
 * GET/PUT/DELETE /api/admin/salespersons/[id]
 * Vercel Serverless Function
 *
 * Manage individual salesperson
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../../lib/security');

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

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const salespersonId = req.query.id;
  if (!salespersonId) {
    return res.status(400).json({ error: { message: 'Salesperson ID is required' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get salesperson detail with stats and partners
      const salespersonResult = await dbPool.query(`
        SELECT
          s.id, s.code, s.name, s.email, s.phone, s.royalty_rate, s.contract_months, s.status,
          s.created_at, s.updated_at,
          COALESCE(stats.total_payments, 0) as total_payments,
          COALESCE(stats.total_revenue, 0) as total_revenue,
          COALESCE(stats.total_royalty, 0) as total_royalty
        FROM salespersons s
        LEFT JOIN (
          SELECT
            salesperson_id,
            SUM(total_payments) as total_payments,
            SUM(total_revenue) as total_revenue,
            SUM(royalty_amount) as total_royalty
          FROM salesperson_monthly_stats
          GROUP BY salesperson_id
        ) stats ON s.id = stats.salesperson_id
        WHERE s.id = $1 AND s.status != 'deleted'
      `, [salespersonId]);

      if (salespersonResult.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Salesperson not found' } });
      }

      const salesperson = salespersonResult.rows[0];

      // Get partners referred by this salesperson
      const partnersResult = await dbPool.query(`
        SELECT
          p.id, p.code, p.name, p.status,
          p.salesperson_contract_start, p.salesperson_contract_months,
          COALESCE(pay_stats.total_payments, 0) as total_payments,
          COALESCE(pay_stats.total_revenue, 0) as total_revenue
        FROM partners p
        LEFT JOIN (
          SELECT
            partner_id,
            SUM(total_payments) as total_payments,
            SUM(total_revenue) as total_revenue
          FROM partner_monthly_stats
          GROUP BY partner_id
        ) pay_stats ON p.id = pay_stats.partner_id
        WHERE p.salesperson_id = $1 AND p.status != 'deleted'
        ORDER BY p.created_at DESC
      `, [salespersonId]);

      // Get monthly stats
      const statsResult = await dbPool.query(`
        SELECT year_month, total_payments, total_revenue, royalty_amount, payout_status
        FROM salesperson_monthly_stats
        WHERE salesperson_id = $1
        ORDER BY year_month DESC
        LIMIT 12
      `, [salespersonId]);

      return res.json({
        success: true,
        salesperson: {
          ...salesperson,
          royalty_rate: parseFloat(salesperson.royalty_rate),
          contract_months: parseInt(salesperson.contract_months) || 12,
          total_payments: parseInt(salesperson.total_payments),
          total_revenue: parseFloat(salesperson.total_revenue),
          total_royalty: parseFloat(salesperson.total_royalty)
        },
        partners: partnersResult.rows.map(p => ({
          ...p,
          total_payments: parseInt(p.total_payments),
          total_revenue: parseFloat(p.total_revenue)
        })),
        monthly_stats: statsResult.rows.map(row => ({
          ...row,
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        }))
      });

    } else if (req.method === 'PUT') {
      // Update salesperson
      const { name, email, password, phone, royalty_rate, contract_months, status } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(passwordHash);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone || null);
      }
      if (royalty_rate !== undefined) {
        updates.push(`royalty_rate = $${paramIndex++}`);
        values.push(royalty_rate);
      }
      if (contract_months !== undefined) {
        updates.push(`contract_months = $${paramIndex++}`);
        values.push(contract_months);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: { message: 'No fields to update' } });
      }

      updates.push(`updated_at = NOW()`);
      values.push(salespersonId);

      const result = await dbPool.query(`
        UPDATE salespersons
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, code, name, email, phone, royalty_rate, contract_months, status, updated_at
      `, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Salesperson not found' } });
      }

      return res.json({
        success: true,
        salesperson: {
          ...result.rows[0],
          royalty_rate: parseFloat(result.rows[0].royalty_rate),
          contract_months: parseInt(result.rows[0].contract_months)
        }
      });

    } else if (req.method === 'DELETE') {
      // Soft delete salesperson
      const result = await dbPool.query(
        `UPDATE salespersons SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
        [salespersonId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Salesperson not found' } });
      }

      return res.json({ success: true, message: 'Salesperson deleted' });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Salesperson Detail API Error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
};
