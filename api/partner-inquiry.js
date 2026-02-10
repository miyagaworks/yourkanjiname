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
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #c75450; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #666; }
    .value { margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>新規パートナー申込</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">店舗名</div>
        <div class="value">${storeName}</div>
      </div>
      <div class="field">
        <div class="label">ご担当者名</div>
        <div class="value">${contactName}</div>
      </div>
      <div class="field">
        <div class="label">メールアドレス</div>
        <div class="value">${email}</div>
      </div>
      <div class="field">
        <div class="label">電話番号</div>
        <div class="value">${phone || '未入力'}</div>
      </div>
      <div class="field">
        <div class="label">申込日時</div>
        <div class="value">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</div>
      </div>
    </div>
  </div>
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
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #c75450; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>お申し込みありがとうございます</h2>
    </div>
    <div class="content">
      <p>${contactName} 様</p>
      <p>Your Kanji Name パートナープログラムへのお申し込みありがとうございます。</p>
      <p>以下の内容でお申し込みを受け付けました。</p>
      <ul>
        <li><strong>店舗名：</strong>${storeName}</li>
        <li><strong>ご担当者名：</strong>${contactName}</li>
        <li><strong>メールアドレス：</strong>${email}</li>
        <li><strong>電話番号：</strong>${phone || '未入力'}</li>
      </ul>
      <p>担当者より2営業日以内にご連絡いたします。</p>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    <div class="footer">
      <p>Your Kanji Name パートナープログラム</p>
      <p>contact@kanjiname.jp</p>
    </div>
  </div>
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
