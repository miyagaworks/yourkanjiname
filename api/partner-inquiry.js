/**
 * Partner Inquiry API
 * POST /api/partner-inquiry
 * Vercel Serverless Function
 *
 * Receives store partner inquiries and sends notification email
 */

const { setCorsHeaders, handlePreflight } = require('./lib/security');

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { storeName, contactName, email, phone } = req.body;

    // Validation
    if (!storeName || !contactName || !email) {
      return res.status(400).json({
        error: { message: '店舗名、ご担当者名、メールアドレスは必須です' }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { message: '有効なメールアドレスを入力してください' }
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.ADMIN_EMAIL || 'contact@kanjiname.jp';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({
        error: { message: 'メール送信の設定がされていません' }
      });
    }

    // Send notification email to admin
    const adminEmailHtml = `
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
          <tr>
            <td style="background:linear-gradient(135deg,#c75450,#a33f3c);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.05em;">新規パートナー申込</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">店舗名</span>
                    <span style="font-size:16px;color:#333;font-weight:600;">${storeName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">ご担当者名</span>
                    <span style="font-size:16px;color:#333;">${contactName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">メールアドレス</span>
                    <a href="mailto:${email}" style="font-size:16px;color:#c75450;text-decoration:none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">電話番号</span>
                    <span style="font-size:16px;color:#333;">${phone || '未入力'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <a href="mailto:${email}" style="display:inline-block;background:#c75450;color:#ffffff;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:600;text-decoration:none;">返信する</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send to admin
    const adminResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Your Kanji Name <noreply@kanjiname.jp>',
        to: notifyEmail,
        subject: `【パートナー申込】${storeName}`,
        html: adminEmailHtml
      })
    });

    if (!adminResponse.ok) {
      const error = await adminResponse.text();
      console.error('Failed to send admin notification:', error);
    }

    // Send confirmation email to applicant
    const confirmEmailHtml = `
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
          <tr>
            <td style="background:linear-gradient(135deg,#c75450,#a33f3c);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.05em;">お申し込みありがとうございます</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 20px;">
              <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.8;">${contactName} 様</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.9;">
                Your Kanji Name パートナープログラムへのお申し込みありがとうございます。<br>
                以下の内容でお申し込みを受け付けました。
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;border-radius:12px;padding:24px;margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 24px;border-bottom:1px solid #eee8e3;">
                    <span style="display:inline-block;width:120px;font-size:13px;color:#999;font-weight:600;">店舗名</span>
                    <span style="font-size:14px;color:#333;font-weight:600;">${storeName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 24px;border-bottom:1px solid #eee8e3;">
                    <span style="display:inline-block;width:120px;font-size:13px;color:#999;font-weight:600;">ご担当者名</span>
                    <span style="font-size:14px;color:#333;">${contactName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 24px;border-bottom:1px solid #eee8e3;">
                    <span style="display:inline-block;width:120px;font-size:13px;color:#999;font-weight:600;">メールアドレス</span>
                    <span style="font-size:14px;color:#333;">${email}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 24px;">
                    <span style="display:inline-block;width:120px;font-size:13px;color:#999;font-weight:600;">電話番号</span>
                    <span style="font-size:14px;color:#333;">${phone || '未入力'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px;">
              <p style="margin:0;font-size:14px;color:#555;line-height:1.9;">
                担当者より<strong style="color:#c75450;">2営業日以内</strong>にご連絡いたします。<br>
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
            </td>
          </tr>
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

    const confirmResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Your Kanji Name <noreply@kanjiname.jp>',
        to: email,
        subject: '【Your Kanji Name】パートナーお申し込み確認',
        html: confirmEmailHtml
      })
    });

    if (!confirmResponse.ok) {
      const error = await confirmResponse.text();
      console.error('Failed to send confirmation email:', error);
    }

    return res.json({
      success: true,
      message: 'お申し込みを受け付けました'
    });

  } catch (error) {
    console.error('Partner inquiry error:', error);
    return res.status(500).json({
      error: { message: 'エラーが発生しました。もう一度お試しください。' }
    });
  }
};
