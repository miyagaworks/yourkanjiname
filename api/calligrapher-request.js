/**
 * Vercel Serverless Function: Calligrapher Request
 * Handles: POST /api/calligrapher-request
 *
 * Saves calligraphy requests and sends confirmation emails
 */

const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, isValidEmail } = require('./lib/security');

// Initialize database pool
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

// Language code to name mapping (for admin email)
const LANGUAGE_NAMES = {
  ja: '日本語',
  en: '英語 (English)',
  fr: 'フランス語 (Français)',
  de: 'ドイツ語 (Deutsch)',
  es: 'スペイン語 (Español)',
  it: 'イタリア語 (Italiano)',
  th: 'タイ語 (ภาษาไทย)',
  vi: 'ベトナム語 (Tiếng Việt)',
  id: 'インドネシア語 (Bahasa Indonesia)',
  ko: '韓国語 (한국어)'
};

// Email configuration per language
const EMAIL_CONFIG = {
  ja: {
    subject: '書道作品のお申し込みを受け付けました',
    greeting: '様',
    greetingFormat: 'name_first', // Japanese: 名前様
    thankYou: 'お申し込みいただきありがとうございます。',
    intro: 'あなたの漢字名「{{kanjiName}}」の書道作品のお申し込みを受け付けました。',
    yourName: 'あなたの漢字名',
    aboutYourName: '漢字名について',
    calligraphyInfo: 'プロの書道家が心を込めて筆で書き上げ、メールでお届けいたします。作品の完成までしばらくお待ちください。',
    closing: 'Your Kanji Name チーム',
    contact: 'お問い合わせ'
  },
  en: {
    subject: 'Your Calligraphy Request Has Been Received',
    greeting: 'Dear',
    thankYou: 'Thank you for your request.',
    intro: 'We have received your request for a calligraphy artwork of your kanji name "{{kanjiName}}".',
    yourName: 'Your Kanji Name',
    aboutYourName: 'About Your Kanji Name',
    calligraphyInfo: 'A professional calligrapher will write your name with care and dedication, and we will send it to you via email. Please wait for your artwork to be completed.',
    closing: 'Your Kanji Name Team',
    contact: 'Contact'
  },
  fr: {
    subject: 'Votre demande de calligraphie a été reçue',
    greeting: 'Cher/Chère',
    thankYou: 'Merci pour votre demande.',
    intro: 'Nous avons reçu votre demande pour une œuvre calligraphique de votre nom kanji « {{kanjiName}} ».',
    yourName: 'Votre nom en kanji',
    aboutYourName: 'À propos de votre nom en kanji',
    calligraphyInfo: 'Un calligraphe professionnel écrira votre nom avec soin et dévouement, et nous vous l\'enverrons par e-mail. Veuillez patienter pendant la réalisation de votre œuvre.',
    closing: 'L\'équipe Your Kanji Name',
    contact: 'Contact'
  },
  de: {
    subject: 'Ihre Kalligraphie-Anfrage wurde erhalten',
    greeting: 'Sehr geehrte/r',
    thankYou: 'Vielen Dank für Ihre Anfrage.',
    intro: 'Wir haben Ihre Anfrage für ein Kalligraphie-Kunstwerk Ihres Kanji-Namens „{{kanjiName}}" erhalten.',
    yourName: 'Ihr Kanji-Name',
    aboutYourName: 'Über Ihren Kanji-Namen',
    calligraphyInfo: 'Ein professioneller Kalligraph wird Ihren Namen mit Sorgfalt und Hingabe schreiben, und wir werden ihn Ihnen per E-Mail zusenden. Bitte warten Sie auf die Fertigstellung Ihres Kunstwerks.',
    closing: 'Das Your Kanji Name Team',
    contact: 'Kontakt'
  },
  es: {
    subject: 'Su solicitud de caligrafía ha sido recibida',
    greeting: 'Estimado/a',
    thankYou: 'Gracias por su solicitud.',
    intro: 'Hemos recibido su solicitud de una obra caligráfica de su nombre kanji "{{kanjiName}}".',
    yourName: 'Su nombre en kanji',
    aboutYourName: 'Sobre su nombre en kanji',
    calligraphyInfo: 'Un calígrafo profesional escribirá su nombre con cuidado y dedicación, y se lo enviaremos por correo electrónico. Por favor, espere a que se complete su obra.',
    closing: 'El equipo de Your Kanji Name',
    contact: 'Contacto'
  },
  it: {
    subject: 'La tua richiesta di calligrafia è stata ricevuta',
    greeting: 'Gentile',
    thankYou: 'Grazie per la tua richiesta.',
    intro: 'Abbiamo ricevuto la tua richiesta per un\'opera calligrafica del tuo nome kanji "{{kanjiName}}".',
    yourName: 'Il tuo nome in kanji',
    aboutYourName: 'Informazioni sul tuo nome in kanji',
    calligraphyInfo: 'Un calligrafo professionista scriverà il tuo nome con cura e dedizione, e te lo invieremo via e-mail. Per favore, attendi il completamento della tua opera.',
    closing: 'Il team di Your Kanji Name',
    contact: 'Contatto'
  },
  th: {
    subject: 'ได้รับคำขอเขียนพู่กันของคุณแล้ว',
    greeting: 'เรียน',
    thankYou: 'ขอบคุณสำหรับคำขอของคุณ',
    intro: 'เราได้รับคำขอสำหรับงานเขียนพู่กันชื่อคันจิของคุณ "{{kanjiName}}" แล้ว',
    yourName: 'ชื่อคันจิของคุณ',
    aboutYourName: 'เกี่ยวกับชื่อคันจิของคุณ',
    calligraphyInfo: 'นักเขียนพู่กันมืออาชีพจะเขียนชื่อของคุณด้วยความใส่ใจและทุ่มเท และเราจะส่งให้คุณทางอีเมล กรุณารอการเสร็จสมบูรณ์ของผลงาน',
    closing: 'ทีม Your Kanji Name',
    contact: 'ติดต่อ'
  },
  vi: {
    subject: 'Yêu cầu thư pháp của bạn đã được nhận',
    greeting: 'Kính gửi',
    thankYou: 'Cảm ơn bạn đã gửi yêu cầu.',
    intro: 'Chúng tôi đã nhận được yêu cầu tác phẩm thư pháp tên kanji "{{kanjiName}}" của bạn.',
    yourName: 'Tên Kanji của bạn',
    aboutYourName: 'Về tên Kanji của bạn',
    calligraphyInfo: 'Một nhà thư pháp chuyên nghiệp sẽ viết tên bạn với sự tận tâm và chúng tôi sẽ gửi cho bạn qua email. Xin vui lòng chờ đợi tác phẩm của bạn hoàn thành.',
    closing: 'Đội ngũ Your Kanji Name',
    contact: 'Liên hệ'
  },
  id: {
    subject: 'Permintaan Kaligrafi Anda Telah Diterima',
    greeting: 'Yth.',
    thankYou: 'Terima kasih atas permintaan Anda.',
    intro: 'Kami telah menerima permintaan Anda untuk karya kaligrafi nama kanji Anda "{{kanjiName}}".',
    yourName: 'Nama Kanji Anda',
    aboutYourName: 'Tentang Nama Kanji Anda',
    calligraphyInfo: 'Seorang kaligrafer profesional akan menulis nama Anda dengan penuh perhatian dan dedikasi, dan kami akan mengirimkannya kepada Anda melalui email. Mohon tunggu hingga karya Anda selesai.',
    closing: 'Tim Your Kanji Name',
    contact: 'Kontak'
  },
  ko: {
    subject: '서예 요청이 접수되었습니다',
    greeting: '안녕하세요',
    thankYou: '요청해 주셔서 감사합니다.',
    intro: '귀하의 한자 이름 "{{kanjiName}}" 서예 작품 요청이 접수되었습니다.',
    yourName: '당신의 한자 이름',
    aboutYourName: '당신의 한자 이름에 대하여',
    calligraphyInfo: '전문 서예가가 정성을 다해 당신의 이름을 써서 이메일로 보내드립니다. 작품이 완성될 때까지 기다려 주세요.',
    closing: 'Your Kanji Name 팀',
    contact: '문의'
  }
};

/**
 * Build greeting line based on language format
 */
function buildGreeting(config, userName) {
  const name = userName || '';
  if (config.greetingFormat === 'name_first') {
    // Japanese style: 名前様
    return name ? `${name}${config.greeting}` : '';
  }
  // Western style: Dear Name,
  return name ? `${config.greeting} ${name},` : '';
}

/**
 * Build user confirmation email HTML
 */
function buildUserEmailHtml(request, config) {
  const intro = config.intro.replace('{{kanjiName}}', request.kanji_name);
  const greeting = buildGreeting(config, request.user_name);

  // Format explanation text with line breaks for HTML
  const explanationHtml = request.explanation_user_lang
    ? request.explanation_user_lang.replace(/\n/g, '<br>')
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
    .kanji-name { font-size: 48px; color: #c75450; margin: 20px 0; }
    .content { padding: 30px 0; }
    .explanation-box { background: #f9f5f5; padding: 20px; border-left: 3px solid #c75450; margin: 20px 0; }
    .explanation-title { font-weight: bold; color: #c75450; margin-bottom: 10px; }
    .explanation-text { line-height: 1.8; }
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
      <p>${config.thankYou}</p>
      <p>${intro}</p>

      <div style="text-align: center; padding: 30px 0;">
        <p style="color: #888; margin-bottom: 10px;">${config.yourName}</p>
        <div class="kanji-name">${request.kanji_name}</div>
      </div>

      ${explanationHtml ? `
      <div class="explanation-box">
        <div class="explanation-title">${config.aboutYourName}</div>
        <div class="explanation-text">${explanationHtml}</div>
      </div>
      ` : ''}

      <p>${config.calligraphyInfo}</p>
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

/**
 * Build admin notification email HTML
 */
function buildAdminEmailHtml(request) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #c75450; color: white; padding: 15px 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #666; }
    .value { margin-top: 5px; }
    .kanji { font-size: 36px; color: #c75450; }
    .explanation { background: white; padding: 15px; border-left: 3px solid #c75450; margin-top: 10px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>新しい書道申込がありました</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">申込者名</div>
        <div class="value">${request.user_name || '(未入力)'}</div>
      </div>
      <div class="field">
        <div class="label">メールアドレス</div>
        <div class="value"><a href="mailto:${request.email}">${request.email}</a></div>
      </div>
      <div class="field">
        <div class="label">選択言語</div>
        <div class="value">${LANGUAGE_NAMES[request.language] || LANGUAGE_NAMES.en}</div>
      </div>
      <div class="field">
        <div class="label">漢字名</div>
        <div class="value kanji">${request.kanji_name}</div>
      </div>
      ${request.explanation_ja ? `
      <div class="field">
        <div class="label">説明文（日本語）</div>
        <div class="explanation">${request.explanation_ja}</div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send email using Resend API
 */
async function sendEmail(to, subject, html) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@yourkanjiname.com>';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email to:', to);
    return false;
  }

  try {
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
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed'
      }
    });
  }

  try {
    const { email, kanji_name, user_name, language, explanation_ja, explanation_user_lang } = req.body;

    // Validate required fields
    if (!email || !kanji_name) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'email and kanji_name are required'
        }
      });
    }

    // Validate email format using shared utility
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Invalid email format'
        }
      });
    }

    // Save to database
    const dbPool = getPool();
    const insertQuery = `
      INSERT INTO calligraphy_requests (
        email, kanji_name, user_name, language, explanation_ja, explanation_user_lang, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      RETURNING id
    `;

    let requestId = null;
    try {
      const result = await dbPool.query(insertQuery, [
        email,
        kanji_name,
        user_name || null,
        language || 'en',
        explanation_ja || null,
        explanation_user_lang || null
      ]);
      requestId = result.rows[0]?.id;
      console.log('Calligraphy request saved with ID:', requestId);
    } catch (dbError) {
      // Table might not exist, log but continue
      console.error('Database error (table may not exist):', dbError.message);
    }

    // Send emails
    const request = { email, kanji_name, user_name, language, explanation_ja, explanation_user_lang };

    // Send user confirmation email
    const config = EMAIL_CONFIG[language] || EMAIL_CONFIG.en;
    const userEmailHtml = buildUserEmailHtml(request, config);
    const userEmailSent = await sendEmail(email, config.subject, userEmailHtml);

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL;
    let adminEmailSent = false;
    if (adminEmail) {
      const adminEmailHtml = buildAdminEmailHtml(request);
      adminEmailSent = await sendEmail(adminEmail, `【書道申込】${user_name || ''}様 - ${kanji_name}`, adminEmailHtml);
    }

    return res.json({
      success: true,
      message: 'Calligraphy request submitted successfully',
      request_id: requestId,
      emails: {
        user: userEmailSent,
        admin: adminEmailSent
      }
    });

  } catch (error) {
    console.error('Calligrapher request error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    });
  }
};
