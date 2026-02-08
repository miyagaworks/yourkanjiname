/**
 * Admin Salesperson Payouts API
 * GET/POST /api/admin/salesperson-payouts
 * Vercel Serverless Function
 *
 * Manage salesperson payouts
 */

const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

/**
 * Send payout notification email to ambassador
 */
async function sendAmbassadorPayoutEmail(ambassador, payoutDetails) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@yourkanjiname.com>';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email');
    return false;
  }

  // Format year_months to Japanese format
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
      <p>${ambassador.name} 様</p>
      <p>いつもYour Kanji Nameアンバサダープログラムにご参加いただき、誠にありがとうございます。</p>
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

      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
      <p>今後とも宜しくお願いいたします。</p>
    </div>
    <div class="footer">
      <p>Your Kanji Name アンバサダープログラム</p>
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
        to: ambassador.email,
        subject: `【Your Kanji Name】ロイヤリティお振込完了のお知らせ（${formattedMonths}）`,
        html: html
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send ambassador payout email:', error);
      return false;
    }

    console.log('Ambassador payout email sent successfully to:', ambassador.email);
    return true;
  } catch (error) {
    console.error('Error sending ambassador payout email:', error);
    return false;
  }
}

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

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get pending payouts by salesperson
      const pendingResult = await dbPool.query(`
        SELECT
          s.id as salesperson_id,
          s.code, s.name, s.email,
          sms.year_month,
          sms.total_payments,
          sms.total_revenue,
          sms.royalty_amount
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE sms.payout_status = 'pending' AND s.status != 'deleted'
        ORDER BY s.name, sms.year_month
      `);

      // Get all monthly stats
      const allStatsResult = await dbPool.query(`
        SELECT
          sms.id,
          s.id as salesperson_id,
          s.code, s.name,
          sms.year_month,
          sms.total_payments,
          sms.total_revenue,
          sms.royalty_amount,
          sms.payout_status,
          sms.paid_at,
          sms.exchange_rate_jpy,
          sms.transfer_fee_jpy,
          sms.net_payout_jpy
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE s.status != 'deleted'
        ORDER BY sms.year_month DESC, s.name
        LIMIT 100
      `);

      // Get summary
      const summaryResult = await dbPool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN royalty_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN royalty_amount ELSE 0 END), 0) as total_paid,
          COUNT(DISTINCT CASE WHEN payout_status = 'pending' THEN salesperson_id END) as salespersons_pending
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE s.status != 'deleted'
      `);

      // Group pending by salesperson
      const pendingByPerson = {};
      for (const row of pendingResult.rows) {
        if (!pendingByPerson[row.salesperson_id]) {
          pendingByPerson[row.salesperson_id] = {
            salesperson_id: row.salesperson_id,
            code: row.code,
            name: row.name,
            email: row.email,
            months: [],
            total_royalty: 0
          };
        }
        pendingByPerson[row.salesperson_id].months.push({
          year_month: row.year_month,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        });
        pendingByPerson[row.salesperson_id].total_royalty += parseFloat(row.royalty_amount);
      }

      return res.json({
        success: true,
        summary: {
          total_pending: parseFloat(summaryResult.rows[0].total_pending),
          total_paid: parseFloat(summaryResult.rows[0].total_paid),
          salespersons_pending: parseInt(summaryResult.rows[0].salespersons_pending)
        },
        pending_payouts: Object.values(pendingByPerson),
        all_stats: allStatsResult.rows.map(row => ({
          ...row,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        }))
      });

    } else if (req.method === 'POST') {
      // Process payout
      const { salesperson_id, year_months, exchange_rate_jpy, transfer_fee_jpy } = req.body;

      if (!salesperson_id || !year_months || !Array.isArray(year_months) || year_months.length === 0) {
        return res.status(400).json({
          error: { message: 'salesperson_id and year_months array are required' }
        });
      }

      if (!exchange_rate_jpy || exchange_rate_jpy <= 0) {
        return res.status(400).json({
          error: { message: 'exchange_rate_jpy is required and must be positive' }
        });
      }

      // Get ambassador info
      const ambassadorResult = await dbPool.query(`
        SELECT id, name, email FROM salespersons WHERE id = $1
      `, [salesperson_id]);

      if (ambassadorResult.rows.length === 0) {
        return res.status(404).json({
          error: { message: 'Ambassador not found' }
        });
      }

      const ambassador = ambassadorResult.rows[0];

      // Get total royalty for selected months
      const totalResult = await dbPool.query(`
        SELECT COALESCE(SUM(royalty_amount), 0) as total
        FROM salesperson_monthly_stats
        WHERE salesperson_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
      `, [salesperson_id, year_months]);

      const totalRoyaltyUsd = parseFloat(totalResult.rows[0].total);
      if (totalRoyaltyUsd <= 0) {
        return res.status(400).json({
          error: { message: 'No pending royalty for selected months' }
        });
      }

      // Calculate payout amounts
      const grossJpy = Math.round(totalRoyaltyUsd * exchange_rate_jpy);
      const fee = parseInt(transfer_fee_jpy) || 0;
      const netJpy = grossJpy - fee;

      // Update monthly stats to paid
      await dbPool.query(`
        UPDATE salesperson_monthly_stats
        SET
          payout_status = 'paid',
          paid_at = NOW(),
          exchange_rate_jpy = $3,
          transfer_fee_jpy = $4,
          net_payout_jpy = $5,
          updated_at = NOW()
        WHERE salesperson_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
      `, [salesperson_id, year_months, exchange_rate_jpy, fee, netJpy]);

      // Send email notification
      await sendAmbassadorPayoutEmail(ambassador, {
        year_months,
        royalty_usd: totalRoyaltyUsd,
        exchange_rate_jpy: parseFloat(exchange_rate_jpy),
        gross_payout_jpy: grossJpy,
        transfer_fee_jpy: fee,
        net_payout_jpy: netJpy
      });

      return res.json({
        success: true,
        payout: {
          salesperson_id,
          year_months,
          total_royalty_usd: totalRoyaltyUsd,
          exchange_rate_jpy,
          gross_jpy: grossJpy,
          transfer_fee_jpy: fee,
          net_payout_jpy: netJpy
        }
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Salesperson payouts API error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
};
