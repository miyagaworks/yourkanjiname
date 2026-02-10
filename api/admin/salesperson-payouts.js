/**
 * Admin Salesperson Payouts API
 * GET/POST /api/admin/salesperson-payouts
 * Vercel Serverless Function
 *
 * Manage salesperson payouts
 */

const { getPool } = require('../lib/db');
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

  const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f2ef;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ef;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c75450,#a33f3c);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.05em;">ロイヤリティのお振込完了のお知らせ</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${now}</p>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.8;">${ambassador.name} 様</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.9;">
                いつもYour Kanji Nameアンバサダープログラムにご参加いただき、誠にありがとうございます。<br>
                下記の通り、ロイヤリティのお振込が完了いたしましたのでご報告いたします。
              </p>
            </td>
          </tr>
          <!-- Amount Box -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border-radius:16px;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px 40px;text-align:center;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">お振込金額</span>
                    <span style="font-size:44px;color:#c75450;font-weight:700;">¥${payoutDetails.net_payout_jpy.toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Details -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">対象期間</span>
                    <span style="font-size:16px;color:#333;">${formattedMonths}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">ロイヤリティ（税込）</span>
                    <span style="font-size:16px;color:#333;">$${payoutDetails.royalty_usd.toFixed(2)} USD</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">適用為替レート</span>
                    <span style="font-size:16px;color:#333;">$1 = ¥${payoutDetails.exchange_rate_jpy.toFixed(2)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">円換算額</span>
                    <span style="font-size:16px;color:#333;">¥${payoutDetails.gross_payout_jpy.toLocaleString()}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">振込手数料</span>
                    <span style="font-size:16px;color:#333;">-¥${payoutDetails.transfer_fee_jpy.toLocaleString()}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">お振込金額</span>
                    <span style="font-size:16px;color:#333;font-weight:700;">¥${payoutDetails.net_payout_jpy.toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Closing -->
          <tr>
            <td style="padding:24px 40px 36px;">
              <p style="margin:0;font-size:14px;color:#555;line-height:1.9;">
                ご不明な点がございましたら、お気軽にお問い合わせください。<br>
                今後とも宜しくお願いいたします。
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f0ece8;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#aaa;">Your Kanji Name アンバサダープログラム</p>
              <a href="mailto:contact@kanjiname.jp" style="font-size:12px;color:#c75450;text-decoration:none;">contact@kanjiname.jp</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get pending payouts by salesperson (exclude current month)
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
        WHERE sms.payout_status = 'pending'
          AND s.status != 'deleted'
          AND sms.year_month < TO_CHAR(NOW(), 'YYYY-MM')
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

      // Get summary (exclude current month from pending)
      const summaryResult = await dbPool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payout_status = 'pending' AND year_month < TO_CHAR(NOW(), 'YYYY-MM') THEN royalty_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN royalty_amount ELSE 0 END), 0) as total_paid,
          COUNT(DISTINCT CASE WHEN payout_status = 'pending' AND year_month < TO_CHAR(NOW(), 'YYYY-MM') THEN salesperson_id END) as salespersons_pending
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
      const { salesperson_id, year_months, exchange_rate_jpy, transfer_fee_jpy, send_email = true } = req.body;

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

      // Calculate payout amounts (1円未満切り捨て)
      const grossJpy = Math.floor(totalRoyaltyUsd * exchange_rate_jpy);
      const fee = parseInt(transfer_fee_jpy) || 0;
      const netJpy = grossJpy - fee;

      // Minimum payout threshold: ¥3,000
      if (netJpy < 3000) {
        return res.status(400).json({
          error: { message: '振込金額が¥3,000未満のため、次月以降に繰り越されます' }
        });
      }

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

      // Send email notification if requested
      let emailSent = false;
      if (send_email && ambassador.email) {
        emailSent = await sendAmbassadorPayoutEmail(ambassador, {
          year_months,
          royalty_usd: totalRoyaltyUsd,
          exchange_rate_jpy: parseFloat(exchange_rate_jpy),
          gross_payout_jpy: grossJpy,
          transfer_fee_jpy: fee,
          net_payout_jpy: netJpy
        });
      }

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
        },
        email_sent: emailSent
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
