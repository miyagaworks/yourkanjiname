/**
 * Admin Partner Detail API
 * GET/PUT/DELETE /api/admin/partners/[id]
 * Vercel Serverless Function
 *
 * View, update, or delete a specific partner
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../../_utils/security');

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
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  // Get partner ID from URL
  const partnerId = parseInt(req.query.id, 10);
  if (isNaN(partnerId)) {
    return res.status(400).json({
      error: { code: 'INVALID_ID', message: 'Invalid partner ID' }
    });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get partner details with stats
      const result = await dbPool.query(`
        SELECT
          p.id, p.code, p.name, p.email, p.contact_name, p.phone, p.address,
          p.bank_name, p.bank_branch, p.bank_account, p.royalty_rate, p.status,
          p.created_at, p.updated_at,
          COALESCE(COUNT(pay.id), 0) as total_payments,
          COALESCE(SUM(CASE WHEN pay.status = 'succeeded' THEN pay.amount ELSE 0 END), 0) as total_revenue
        FROM partners p
        LEFT JOIN payments pay ON p.id = pay.partner_id
        WHERE p.id = $1
        GROUP BY p.id
      `, [partnerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      const partner = result.rows[0];

      // Get monthly stats
      const statsResult = await dbPool.query(`
        SELECT year_month, total_payments, total_revenue, royalty_amount, payout_status, paid_at
        FROM partner_monthly_stats
        WHERE partner_id = $1
        ORDER BY year_month DESC
        LIMIT 24
      `, [partnerId]);

      return res.json({
        success: true,
        partner: {
          ...partner,
          royalty_rate: parseFloat(partner.royalty_rate),
          total_payments: parseInt(partner.total_payments),
          total_revenue: parseFloat(partner.total_revenue),
          total_royalty: parseFloat(partner.total_revenue) * parseFloat(partner.royalty_rate)
        },
        monthly_stats: statsResult.rows.map(row => ({
          ...row,
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        }))
      });

    } else if (req.method === 'PUT') {
      // Update partner
      const {
        name,
        email,
        password,
        contact_name,
        phone,
        address,
        bank_name,
        bank_branch,
        bank_account,
        royalty_rate,
        price_usd,
        status
      } = req.body;

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;

      if (name !== undefined) {
        paramCount++;
        updates.push(`name = $${paramCount}`);
        values.push(name);
      }

      if (email !== undefined) {
        // Check for duplicate email
        const existingResult = await dbPool.query(
          'SELECT id FROM partners WHERE email = $1 AND id != $2',
          [email.toLowerCase(), partnerId]
        );
        if (existingResult.rows.length > 0) {
          return res.status(409).json({
            error: { code: 'DUPLICATE_EMAIL', message: 'Email already registered' }
          });
        }
        paramCount++;
        updates.push(`email = $${paramCount}`);
        values.push(email.toLowerCase());
      }

      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        paramCount++;
        updates.push(`password_hash = $${paramCount}`);
        values.push(passwordHash);
      }

      if (contact_name !== undefined) {
        paramCount++;
        updates.push(`contact_name = $${paramCount}`);
        values.push(contact_name);
      }

      if (phone !== undefined) {
        paramCount++;
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
      }

      if (address !== undefined) {
        paramCount++;
        updates.push(`address = $${paramCount}`);
        values.push(address);
      }

      if (bank_name !== undefined) {
        paramCount++;
        updates.push(`bank_name = $${paramCount}`);
        values.push(bank_name);
      }

      if (bank_branch !== undefined) {
        paramCount++;
        updates.push(`bank_branch = $${paramCount}`);
        values.push(bank_branch);
      }

      if (bank_account !== undefined) {
        paramCount++;
        updates.push(`bank_account = $${paramCount}`);
        values.push(bank_account);
      }

      if (royalty_rate !== undefined) {
        paramCount++;
        updates.push(`royalty_rate = $${paramCount}`);
        values.push(royalty_rate);
      }

      if (price_usd !== undefined) {
        paramCount++;
        updates.push(`price_usd = $${paramCount}`);
        values.push(price_usd);
      }

      if (status !== undefined) {
        if (!['active', 'inactive', 'suspended', 'deleted'].includes(status)) {
          return res.status(400).json({
            error: { code: 'INVALID_STATUS', message: 'Invalid status value' }
          });
        }
        paramCount++;
        updates.push(`status = $${paramCount}`);
        values.push(status);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'No fields to update' }
        });
      }

      // Add partner ID
      paramCount++;
      values.push(partnerId);

      const updateQuery = `
        UPDATE partners
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id, code, name, email, contact_name, phone, address,
                  bank_name, bank_branch, bank_account, royalty_rate, price_usd, status, created_at, updated_at
      `;

      const result = await dbPool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      return res.json({
        success: true,
        partner: {
          ...result.rows[0],
          royalty_rate: parseFloat(result.rows[0].royalty_rate)
        }
      });

    } else if (req.method === 'DELETE') {
      // Soft delete partner (set status to 'deleted')
      const result = await dbPool.query(
        `UPDATE partners SET status = 'deleted', updated_at = NOW() WHERE id = $1 RETURNING id`,
        [partnerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      return res.json({
        success: true,
        message: 'Partner deleted successfully'
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Admin partner detail error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
