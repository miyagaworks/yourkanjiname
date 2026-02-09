/**
 * Admin Payouts API
 * GET/POST /api/admin/payouts
 * Vercel Serverless Function
 *
 * Manage partner payouts
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
 * Send payout notification email to partner
 */
async function sendPayoutEmail(partner, payoutDetails) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@yourkanjiname.com>';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return false;
  }

  // Format year_months to Japanese format (e.g., "2026-01" -> "2026年1月")
  const formatYearMonth = (ym) => {
    const [year, month] = ym.split('-');
    return `${year}年${parseInt(month)}月`;
  };
  const formattedMonths = payoutDetails.year_months.map(formatYearMonth).join('、');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #c75450; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .amount-box { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .amount { font-size: 32px; color: #c75450; font-weight: bold; }
    .details { margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>ロイヤリティのお振込完了のお知らせ</h2>
    </div>
    <div class="content">
      <p>${partner.name} 様</p>
      <p>いつもYour Kanji Nameパートナープログラムにご参加いただき、誠にありがとうございます。</p>
      <p>下記の通り、ロイヤリティのお振込が完了いたしましたのでご報告いたします。</p>

      <div class="amount-box">
        <div>お振込金額</div>
        <div class="amount">¥${payoutDetails.net_payout_jpy.toLocaleString()}</div>
      </div>

      <div class="details">
        <div class="detail-row">
          <span>対象期間：</span>
          <span>${formattedMonths}</span>
        </div>
        <div class="detail-row">
          <span>ロイヤリティ（税込）：</span>
          <span>$${payoutDetails.royalty_usd.toFixed(2)} USD</span>
        </div>
        <div class="detail-row">
          <span>適用為替レート：</span>
          <span>$1 = ¥${payoutDetails.exchange_rate_jpy.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span>円換算額：</span>
          <span>¥${payoutDetails.gross_payout_jpy.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span>振込手数料：</span>
          <span>-¥${payoutDetails.transfer_fee_jpy.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span><strong>お振込金額：</strong></span>
          <span><strong>¥${payoutDetails.net_payout_jpy.toLocaleString()}</strong></span>
        </div>
      </div>

      <div class="details">
        <div class="detail-row">
          <span>お振込先：</span>
          <span>${partner.bank_name} ${partner.bank_branch || ''}</span>
        </div>
        <div class="detail-row">
          <span>口座番号：</span>
          <span>${partner.bank_account}</span>
        </div>
      </div>

      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      <p>今後とも宜しくお願いいたします。</p>
    </div>
    <div class="footer">
      <p>Your Kanji Name パートナープログラム</p>
      <p>contact@kanjiname.jp</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: partner.email,
        subject: `【Your Kanji Name】ロイヤリティお振込完了のお知らせ（${formattedMonths}）`,
        html: html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send payout email:', error);
      return false;
    }

    console.log('Payout email sent to:', partner.email);
    return true;
  } catch (error) {
    console.error('Error sending payout email:', error);
    return false;
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get pending payouts grouped by partner with bank info (exclude current month)
      const pendingResult = await dbPool.query(`
        SELECT
          p.id as partner_id,
          p.code,
          p.name,
          p.email,
          p.contact_name,
          p.bank_name,
          p.bank_branch,
          p.bank_account,
          p.royalty_rate,
          COALESCE(SUM(pms.total_payments), 0) as total_payments,
          COALESCE(SUM(pms.total_revenue), 0) as total_revenue,
          COALESCE(SUM(pms.royalty_amount), 0) as pending_royalty,
          array_agg(pms.year_month ORDER BY pms.year_month DESC) as pending_months,
          array_agg(pms.id ORDER BY pms.year_month DESC) as pending_stat_ids
        FROM partners p
        JOIN partner_monthly_stats pms ON p.id = pms.partner_id
        WHERE pms.payout_status = 'pending'
          AND pms.year_month < TO_CHAR(NOW(), 'YYYY-MM')
        GROUP BY p.id
        ORDER BY pending_royalty DESC
      `);

      // Get all monthly stats for the detail view
      const allStatsResult = await dbPool.query(`
        SELECT
          pms.id,
          pms.partner_id,
          pms.year_month,
          pms.total_payments,
          pms.total_revenue,
          pms.royalty_amount,
          pms.payout_status,
          pms.paid_at,
          pms.exchange_rate_jpy,
          pms.transfer_fee_jpy,
          pms.net_payout_jpy,
          p.name as partner_name,
          p.code as partner_code
        FROM partner_monthly_stats pms
        JOIN partners p ON pms.partner_id = p.id
        ORDER BY pms.year_month DESC, p.name ASC
        LIMIT 200
      `);

      // Get payout summary (exclude current month from pending)
      const summaryResult = await dbPool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payout_status = 'pending' AND year_month < TO_CHAR(NOW(), 'YYYY-MM') THEN royalty_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN royalty_amount ELSE 0 END), 0) as total_paid,
          COUNT(DISTINCT CASE WHEN payout_status = 'pending' AND year_month < TO_CHAR(NOW(), 'YYYY-MM') THEN partner_id END) as partners_pending
        FROM partner_monthly_stats
      `);

      const summary = summaryResult.rows[0];

      return res.json({
        success: true,
        pending_payouts: pendingResult.rows.map(row => ({
          partner_id: row.partner_id,
          code: row.code,
          name: row.name,
          email: row.email,
          contact_name: row.contact_name,
          bank_name: row.bank_name,
          bank_branch: row.bank_branch,
          bank_account: row.bank_account,
          royalty_rate: parseFloat(row.royalty_rate),
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          pending_royalty: parseFloat(row.pending_royalty),
          pending_months: row.pending_months.filter(m => m !== null),
          pending_stat_ids: row.pending_stat_ids.filter(id => id !== null)
        })),
        all_stats: allStatsResult.rows.map(row => ({
          id: row.id,
          partner_id: row.partner_id,
          partner_name: row.partner_name,
          partner_code: row.partner_code,
          year_month: row.year_month,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount),
          payout_status: row.payout_status,
          paid_at: row.paid_at,
          exchange_rate_jpy: row.exchange_rate_jpy ? parseFloat(row.exchange_rate_jpy) : null,
          transfer_fee_jpy: row.transfer_fee_jpy ? parseInt(row.transfer_fee_jpy) : null,
          net_payout_jpy: row.net_payout_jpy ? parseInt(row.net_payout_jpy) : null
        })),
        summary: {
          total_pending: parseFloat(summary.total_pending),
          total_paid: parseFloat(summary.total_paid),
          partners_pending: parseInt(summary.partners_pending)
        }
      });

    } else if (req.method === 'POST') {
      // Mark payouts as paid with exchange rate and fee
      const {
        partner_id,
        year_months,
        exchange_rate_jpy,
        transfer_fee_jpy,
        send_email = true
      } = req.body;

      if (!partner_id) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'partner_id is required' }
        });
      }

      if (!year_months || !Array.isArray(year_months) || year_months.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'year_months array is required' }
        });
      }

      if (!exchange_rate_jpy || exchange_rate_jpy <= 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'Valid exchange_rate_jpy is required' }
        });
      }

      // Get partner info
      const partnerResult = await dbPool.query(
        'SELECT id, name, email, bank_name, bank_branch, bank_account FROM partners WHERE id = $1',
        [partner_id]
      );

      if (partnerResult.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Partner not found' }
        });
      }

      const partner = partnerResult.rows[0];

      // Get total royalty for the months
      const royaltyResult = await dbPool.query(`
        SELECT COALESCE(SUM(royalty_amount), 0) as total_royalty
        FROM partner_monthly_stats
        WHERE partner_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
      `, [partner_id, year_months]);

      const totalRoyaltyUsd = parseFloat(royaltyResult.rows[0].total_royalty);
      const grossPayoutJpy = Math.floor(totalRoyaltyUsd * exchange_rate_jpy); // 1円未満切り捨て
      const fee = parseInt(transfer_fee_jpy) || 0;
      const netPayoutJpy = grossPayoutJpy - fee;

      if (netPayoutJpy < 0) {
        return res.status(400).json({
          error: { code: 'INVALID_FEE', message: 'Transfer fee exceeds payout amount' }
        });
      }

      // Minimum payout threshold: ¥3,000
      if (netPayoutJpy < 3000) {
        return res.status(400).json({
          error: { code: 'BELOW_MINIMUM', message: '振込金額が¥3,000未満のため、次月以降に繰り越されます' }
        });
      }

      // Mark as paid with payout details
      const result = await dbPool.query(`
        UPDATE partner_monthly_stats
        SET
          payout_status = 'paid',
          paid_at = NOW(),
          exchange_rate_jpy = $3,
          transfer_fee_jpy = $4,
          net_payout_jpy = $5
        WHERE partner_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
        RETURNING id, year_month, royalty_amount
      `, [partner_id, year_months, exchange_rate_jpy, fee, netPayoutJpy]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'No pending payouts found for specified months' }
        });
      }

      // Send email notification if requested
      let emailSent = false;
      if (send_email && partner.email) {
        emailSent = await sendPayoutEmail(partner, {
          year_months: year_months,
          royalty_usd: totalRoyaltyUsd,
          exchange_rate_jpy: exchange_rate_jpy,
          gross_payout_jpy: grossPayoutJpy,
          transfer_fee_jpy: fee,
          net_payout_jpy: netPayoutJpy
        });
      }

      return res.json({
        success: true,
        message: `Marked ${result.rows.length} month(s) as paid`,
        payout_details: {
          partner_id: partner_id,
          partner_name: partner.name,
          year_months: year_months,
          royalty_usd: totalRoyaltyUsd,
          exchange_rate_jpy: exchange_rate_jpy,
          gross_payout_jpy: grossPayoutJpy,
          transfer_fee_jpy: fee,
          net_payout_jpy: netPayoutJpy,
          bank_name: partner.bank_name,
          bank_branch: partner.bank_branch,
          bank_account: partner.bank_account
        },
        email_sent: emailSent
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Admin payouts error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
