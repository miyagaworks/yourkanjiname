/**
 * Admin Payouts API
 * GET/POST /api/admin/payouts
 * Vercel Serverless Function
 *
 * Manage partner payouts
 */

const { getPool } = require('../lib/db');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

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
              <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.8;">${partner.name} 様</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.9;">
                いつもYour Kanji Nameパートナープログラムにご参加いただき、誠にありがとうございます。<br>
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
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">お振込金額</span>
                    <span style="font-size:16px;color:#333;font-weight:700;">¥${payoutDetails.net_payout_jpy.toLocaleString()}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Bank Info -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">お振込先</span>
                    <span style="font-size:16px;color:#333;">${partner.bank_name} ${partner.bank_branch || ''}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">口座番号</span>
                    <span style="font-size:16px;color:#333;">${partner.bank_account}</span>
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
              <p style="margin:0 0 4px;font-size:12px;color:#aaa;">Your Kanji Name パートナープログラム</p>
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
