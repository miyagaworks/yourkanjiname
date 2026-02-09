/**
 * Partner Profile API
 * GET/PUT /api/partner/profile
 * Vercel Serverless Function
 *
 * View or update partner profile
 */

const bcrypt = require('bcrypt');
const { getPool } = require('../lib/db');
const { setCorsHeaders, handlePreflight, verifyPartnerToken } = require('../lib/security');

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  // Verify authentication
  const partnerId = verifyPartnerToken(req.headers.authorization);
  if (!partnerId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get profile
      const result = await dbPool.query(
        `SELECT id, code, name, email, contact_name, phone, address,
                bank_name, bank_account, royalty_rate, status, created_at
         FROM partners WHERE id = $1`,
        [partnerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      const partner = result.rows[0];

      return res.json({
        partner: {
          id: partner.id,
          code: partner.code,
          name: partner.name,
          email: partner.email,
          contact_name: partner.contact_name,
          phone: partner.phone,
          address: partner.address,
          bank_name: partner.bank_name,
          bank_account: partner.bank_account,
          royalty_rate: parseFloat(partner.royalty_rate),
          status: partner.status,
          created_at: partner.created_at
        }
      });

    } else if (req.method === 'PUT') {
      // Update profile
      const {
        name,
        contact_name,
        phone,
        address,
        bank_name,
        bank_account,
        current_password,
        new_password
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

      if (bank_account !== undefined) {
        paramCount++;
        updates.push(`bank_account = $${paramCount}`);
        values.push(bank_account);
      }

      // Handle password change
      if (new_password) {
        if (!current_password) {
          return res.status(400).json({
            error: { code: 'INVALID_REQUEST', message: 'Current password is required to change password' }
          });
        }

        // Verify current password
        const partnerResult = await dbPool.query(
          'SELECT password_hash FROM partners WHERE id = $1',
          [partnerId]
        );

        if (partnerResult.rows.length === 0) {
          return res.status(404).json({
            error: { code: 'NOT_FOUND', message: 'Partner not found' }
          });
        }

        const passwordMatch = await bcrypt.compare(current_password, partnerResult.rows[0].password_hash);
        if (!passwordMatch) {
          return res.status(400).json({
            error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' }
          });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(new_password, 10);
        paramCount++;
        updates.push(`password_hash = $${paramCount}`);
        values.push(newPasswordHash);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'No fields to update' }
        });
      }

      // Add updated_at
      paramCount++;
      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      // Add partner ID
      paramCount++;
      values.push(partnerId);

      const updateQuery = `
        UPDATE partners
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, code, name, email, contact_name, phone, address,
                  bank_name, bank_account, royalty_rate, status
      `;

      const result = await dbPool.query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      const partner = result.rows[0];

      return res.json({
        success: true,
        partner: {
          id: partner.id,
          code: partner.code,
          name: partner.name,
          email: partner.email,
          contact_name: partner.contact_name,
          phone: partner.phone,
          address: partner.address,
          bank_name: partner.bank_name,
          bank_account: partner.bank_account,
          royalty_rate: parseFloat(partner.royalty_rate),
          status: partner.status
        }
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Partner profile error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
