/**
 * Admin Send Calligraphy API
 * POST /api/admin/send-calligraphy
 * Sends the calligraphy image to the user via email
 */

const { Pool } = require('pg');
const crypto = require('crypto');

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

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const [tokenValue, tokenHash] = token.split('.');

  if (!tokenValue || !tokenHash) {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const expectedHash = crypto.createHash('sha256')
    .update(tokenValue + adminPassword)
    .digest('hex')
    .substring(0, 16);

  return tokenHash === expectedHash;
}

// Email templates per language
const EMAIL_CONFIG = {
  ja: {
    subject: 'あなたの書道作品が完成しました！',
    greeting: '様',
    greetingFormat: 'name_first',
    intro: 'お待たせいたしました。あなたの漢字名「{{kanjiName}}」の書道作品が完成しました。',
    message: 'プロの書道家が心を込めて筆で書き上げました。日本の伝統文化である書道の美しさを、ぜひお楽しみください。',
    yourArtwork: 'あなたの書道作品',
    poemTitle: 'あなただけの折句（おりく）',
    closing: 'Your Kanji Name チーム',
    contact: 'お問い合わせ',
    note: '※画像は30日後に削除されますので、お早めにダウンロードしてください。'
  },
  en: {
    subject: 'Your Calligraphy Artwork is Ready!',
    greeting: 'Dear',
    intro: 'Thank you for waiting. Your calligraphy artwork for "{{kanjiName}}" is now complete.',
    message: 'A professional calligrapher has carefully crafted your name with traditional Japanese brush techniques. We hope you enjoy the beauty of Japanese calligraphy.',
    yourArtwork: 'Your Calligraphy Artwork',
    poemTitle: 'Your Personal Japanese Poem (折句 Oriku)',
    closing: 'Your Kanji Name Team',
    contact: 'Contact',
    note: '* Please download the image within 30 days as it will be deleted after that.'
  },
  fr: {
    subject: 'Votre œuvre calligraphique est prête !',
    greeting: 'Cher/Chère',
    intro: 'Merci de votre patience. Votre œuvre calligraphique pour « {{kanjiName}} » est maintenant terminée.',
    message: 'Un calligraphe professionnel a soigneusement créé votre nom avec les techniques traditionnelles du pinceau japonais. Nous espérons que vous apprécierez la beauté de la calligraphie japonaise.',
    yourArtwork: 'Votre œuvre calligraphique',
    poemTitle: 'Votre poème japonais personnel (折句 Oriku)',
    closing: "L'équipe Your Kanji Name",
    contact: 'Contact',
    note: '* Veuillez télécharger l\'image dans les 30 jours car elle sera supprimée après.'
  },
  de: {
    subject: 'Ihr Kalligraphie-Kunstwerk ist fertig!',
    greeting: 'Sehr geehrte/r',
    intro: 'Vielen Dank für Ihre Geduld. Ihr Kalligraphie-Kunstwerk für „{{kanjiName}}" ist nun fertig.',
    message: 'Ein professioneller Kalligraph hat Ihren Namen sorgfältig mit traditionellen japanischen Pinseltechniken gestaltet. Wir hoffen, dass Sie die Schönheit der japanischen Kalligraphie genießen.',
    yourArtwork: 'Ihr Kalligraphie-Kunstwerk',
    poemTitle: 'Ihr persönliches japanisches Gedicht (折句 Oriku)',
    closing: 'Das Your Kanji Name Team',
    contact: 'Kontakt',
    note: '* Bitte laden Sie das Bild innerhalb von 30 Tagen herunter, da es danach gelöscht wird.'
  },
  es: {
    subject: '¡Su obra caligráfica está lista!',
    greeting: 'Estimado/a',
    intro: 'Gracias por esperar. Su obra caligráfica para "{{kanjiName}}" ya está completa.',
    message: 'Un calígrafo profesional ha creado cuidadosamente su nombre con técnicas tradicionales de pincel japonés. Esperamos que disfrute de la belleza de la caligrafía japonesa.',
    yourArtwork: 'Su obra caligráfica',
    poemTitle: 'Su poema japonés personal (折句 Oriku)',
    closing: 'El equipo de Your Kanji Name',
    contact: 'Contacto',
    note: '* Por favor descargue la imagen dentro de 30 días ya que será eliminada después.'
  },
  it: {
    subject: 'La tua opera calligrafica è pronta!',
    greeting: 'Gentile',
    intro: 'Grazie per l\'attesa. La tua opera calligrafica per "{{kanjiName}}" è ora completa.',
    message: 'Un calligrafo professionista ha creato con cura il tuo nome con le tecniche tradizionali del pennello giapponese. Speriamo che apprezzerai la bellezza della calligrafia giapponese.',
    yourArtwork: 'La tua opera calligrafica',
    poemTitle: 'La tua poesia giapponese personale (折句 Oriku)',
    closing: 'Il team di Your Kanji Name',
    contact: 'Contatto',
    note: '* Si prega di scaricare l\'immagine entro 30 giorni poiché verrà eliminata dopo.'
  },
  th: {
    subject: 'ผลงานเขียนพู่กันของคุณพร้อมแล้ว!',
    greeting: 'เรียน',
    intro: 'ขอบคุณที่รอ ผลงานเขียนพู่กันสำหรับ "{{kanjiName}}" ของคุณเสร็จสมบูรณ์แล้ว',
    message: 'นักเขียนพู่กันมืออาชีพได้สร้างสรรค์ชื่อของคุณอย่างพิถีพิถันด้วยเทคนิคพู่กันแบบญี่ปุ่นดั้งเดิม เราหวังว่าคุณจะชื่นชมความงามของการเขียนพู่กันญี่ปุ่น',
    yourArtwork: 'ผลงานเขียนพู่กันของคุณ',
    poemTitle: 'บทกวีญี่ปุ่นส่วนตัวของคุณ (折句 Oriku)',
    closing: 'ทีม Your Kanji Name',
    contact: 'ติดต่อ',
    note: '* กรุณาดาวน์โหลดรูปภาพภายใน 30 วัน เนื่องจากจะถูกลบหลังจากนั้น'
  },
  vi: {
    subject: 'Tác phẩm thư pháp của bạn đã sẵn sàng!',
    greeting: 'Kính gửi',
    intro: 'Cảm ơn bạn đã chờ đợi. Tác phẩm thư pháp cho "{{kanjiName}}" của bạn đã hoàn thành.',
    message: 'Một nhà thư pháp chuyên nghiệp đã cẩn thận tạo ra tên của bạn bằng kỹ thuật bút lông truyền thống Nhật Bản. Chúng tôi hy vọng bạn sẽ thưởng thức vẻ đẹp của thư pháp Nhật Bản.',
    yourArtwork: 'Tác phẩm thư pháp của bạn',
    poemTitle: 'Bài thơ Nhật Bản cá nhân của bạn (折句 Oriku)',
    closing: 'Đội ngũ Your Kanji Name',
    contact: 'Liên hệ',
    note: '* Vui lòng tải xuống hình ảnh trong vòng 30 ngày vì nó sẽ bị xóa sau đó.'
  },
  id: {
    subject: 'Karya Kaligrafi Anda Sudah Siap!',
    greeting: 'Yth.',
    intro: 'Terima kasih telah menunggu. Karya kaligrafi Anda untuk "{{kanjiName}}" sekarang sudah selesai.',
    message: 'Seorang kaligrafer profesional telah dengan hati-hati membuat nama Anda dengan teknik kuas tradisional Jepang. Kami harap Anda menikmati keindahan kaligrafi Jepang.',
    yourArtwork: 'Karya Kaligrafi Anda',
    poemTitle: 'Puisi Jepang Pribadi Anda (折句 Oriku)',
    closing: 'Tim Your Kanji Name',
    contact: 'Kontak',
    note: '* Silakan unduh gambar dalam 30 hari karena akan dihapus setelah itu.'
  },
  ko: {
    subject: '당신의 서예 작품이 완성되었습니다!',
    greeting: '안녕하세요',
    intro: '기다려 주셔서 감사합니다. "{{kanjiName}}"의 서예 작품이 완성되었습니다.',
    message: '전문 서예가가 일본 전통 붓 기법으로 정성껏 당신의 이름을 써 주었습니다. 일본 서예의 아름다움을 즐겨 주세요.',
    yourArtwork: '당신의 서예 작품',
    poemTitle: '당신만의 일본 시 (折句 Oriku)',
    closing: 'Your Kanji Name 팀',
    contact: '문의',
    note: '* 이미지는 30일 후에 삭제되므로 그 전에 다운로드해 주세요.'
  }
};

function buildGreeting(config, userName) {
  const name = userName || '';
  if (config.greetingFormat === 'name_first') {
    return name ? `${name}${config.greeting}` : '';
  }
  return name ? `${config.greeting} ${name},` : '';
}

function buildEmailHtml(request, config, imageUrl, poemText) {
  const intro = config.intro.replace('{{kanjiName}}', request.kanji_name);
  const greeting = buildGreeting(config, request.user_name);

  // Convert poem text to HTML (preserve line breaks)
  const poemHtml = poemText
    ? `<div class="poem-section">
        <h3 style="color: #c75450; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">${config.poemTitle}</h3>
        <div style="white-space: pre-wrap; font-family: 'Noto Sans JP', monospace; line-height: 2; background: #f9f9f9; padding: 20px; border-radius: 8px;">${poemText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #c75450; }
    .content { padding: 30px 0; }
    .artwork-section { text-align: center; padding: 30px 0; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
    .artwork-label { color: #888; margin-bottom: 15px; font-size: 14px; }
    .artwork-image { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    .poem-section { margin: 30px 0; }
    .note { font-size: 12px; color: #888; margin-top: 20px; padding: 15px; background: #fff9e6; border-radius: 4px; }
    .footer { text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://app.kanjiname.jp/images/logo_color.png" alt="Your Kanji Name" width="300" style="max-width: 100%; height: auto;">
    </div>
    <div class="content">
      ${greeting ? `<p>${greeting}</p>` : ''}
      <p>${intro}</p>
      <p>${config.message}</p>

      <div class="artwork-section">
        <p class="artwork-label">${config.yourArtwork}</p>
        <img src="${imageUrl}" alt="${request.kanji_name}" class="artwork-image">
      </div>

      ${poemHtml}

      <div class="note">${config.note}</div>
    </div>
    <div class="footer">
      <p>${config.closing}</p>
      <p>${config.contact}: <a href="mailto:contact@kanjiname.jp" style="color: #c75450;">contact@kanjiname.jp</a></p>
      <p>&copy; ${new Date().getFullYear()} Your Kanji Name</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

async function sendEmail(to, subject, html) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@yourkanjiname.com>';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }

  return true;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyToken(req)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  try {
    const { requestId, imageUrl, poemText } = req.body;

    if (!requestId || !imageUrl) {
      return res.status(400).json({
        error: { message: 'requestId and imageUrl are required' }
      });
    }

    // Get request from database
    const dbPool = getPool();
    const result = await dbPool.query(
      'SELECT * FROM calligraphy_requests WHERE id = $1',
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Request not found' }
      });
    }

    const request = result.rows[0];

    // Get email config for user's language
    const config = EMAIL_CONFIG[request.language] || EMAIL_CONFIG.en;

    // Build and send email
    const emailHtml = buildEmailHtml(request, config, imageUrl, poemText || '');
    await sendEmail(request.email, config.subject, emailHtml);

    // Update request status
    await dbPool.query(
      'UPDATE calligraphy_requests SET status = $1, sent_at = NOW(), image_url = $2 WHERE id = $3',
      ['sent', imageUrl, requestId]
    );

    return res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Send calligraphy error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Failed to send email' }
    });
  }
};
