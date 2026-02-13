/**
 * Vercel Serverless Function: Calligrapher Request
 * Handles: POST /api/calligrapher-request
 *
 * Saves calligraphy requests and sends confirmation emails
 */

const { Pool } = require('pg');

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

// Email configuration per language
const EMAIL_CONFIG = {
  ja: {
    subject: '書道作品のお申し込みを受け付けました',
    greeting: '様',
    thankYou: 'お申し込みいただきありがとうございます。',
    intro: 'あなたの漢字名「{{kanjiName}}」の書道作品のお申し込みを受け付けました。',
    yourName: 'あなたの漢字名',
    calligraphyInfo: 'プロの書道家が心を込めて筆で書き上げ、1週間以内にメールでお届けいたします。',
    closing: 'Your Kanji Name チーム'
  },
  en: {
    subject: 'Your Calligraphy Request Has Been Received',
    greeting: 'Dear',
    thankYou: 'Thank you for your request.',
    intro: 'We have received your request for a calligraphy artwork of your kanji name "{{kanjiName}}".',
    yourName: 'Your Kanji Name',
    calligraphyInfo: 'A professional calligrapher will write your name with care and dedication. Your artwork will be delivered to your email within one week.',
    closing: 'Your Kanji Name Team'
  },
  fr: {
    subject: 'Votre demande de calligraphie a été reçue',
    greeting: 'Cher/Chère',
    thankYou: 'Merci pour votre demande.',
    intro: 'Nous avons reçu votre demande pour une œuvre calligraphique de votre nom kanji « {{kanjiName}} ».',
    yourName: 'Votre nom en kanji',
    calligraphyInfo: 'Un calligraphe professionnel \u00e9crira votre nom avec soin et d\u00e9vouement. Votre \u0153uvre vous sera envoy\u00e9e par e-mail sous une semaine.',
    closing: 'L\'équipe Your Kanji Name'
  },
  de: {
    subject: 'Ihre Kalligraphie-Anfrage wurde erhalten',
    greeting: 'Sehr geehrte/r',
    thankYou: 'Vielen Dank für Ihre Anfrage.',
    intro: 'Wir haben Ihre Anfrage für ein Kalligraphie-Kunstwerk Ihres Kanji-Namens „{{kanjiName}}" erhalten.',
    yourName: 'Ihr Kanji-Name',
    calligraphyInfo: 'Ein professioneller Kalligraph wird Ihren Namen mit Sorgfalt und Hingabe schreiben. Ihr Kunstwerk wird Ihnen innerhalb einer Woche per E-Mail zugesandt.',
    closing: 'Das Your Kanji Name Team'
  },
  es: {
    subject: 'Su solicitud de caligrafía ha sido recibida',
    greeting: 'Estimado/a',
    thankYou: 'Gracias por su solicitud.',
    intro: 'Hemos recibido su solicitud de una obra caligráfica de su nombre kanji "{{kanjiName}}".',
    yourName: 'Su nombre en kanji',
    calligraphyInfo: 'Un cal\u00edgrafo profesional escribir\u00e1 su nombre con cuidado y dedicaci\u00f3n. Su obra ser\u00e1 enviada a su correo electr\u00f3nico en un plazo de una semana.',
    closing: 'El equipo de Your Kanji Name'
  },
  pt: {
    subject: 'Sua solicitação de caligrafia foi recebida',
    greeting: 'Prezado(a)',
    thankYou: 'Obrigado pela sua solicitação.',
    intro: 'Recebemos sua solicitação de uma obra caligráfica do seu nome em kanji "{{kanjiName}}".',
    yourName: 'Seu nome em kanji',
    calligraphyInfo: 'Um cal\u00edgrafo profissional escrever\u00e1 seu nome com cuidado e dedica\u00e7\u00e3o. Sua obra ser\u00e1 enviada para o seu e-mail dentro de uma semana.',
    closing: 'Equipe Your Kanji Name'
  },
  it: {
    subject: 'La tua richiesta di calligrafia è stata ricevuta',
    greeting: 'Gentile',
    thankYou: 'Grazie per la tua richiesta.',
    intro: 'Abbiamo ricevuto la tua richiesta per un\'opera calligrafica del tuo nome kanji "{{kanjiName}}".',
    yourName: 'Il tuo nome in kanji',
    calligraphyInfo: 'Un calligrafo professionista scriver\u00e0 il tuo nome con cura e dedizione. La tua opera ti sar\u00e0 inviata via e-mail entro una settimana.',
    closing: 'Il team di Your Kanji Name'
  },
  th: {
    subject: 'ได้รับคำขอเขียนพู่กันของคุณแล้ว',
    greeting: 'เรียน',
    thankYou: 'ขอบคุณสำหรับคำขอของคุณ',
    intro: 'เราได้รับคำขอสำหรับงานเขียนพู่กันชื่อคันจิของคุณ "{{kanjiName}}" แล้ว',
    yourName: 'ชื่อคันจิของคุณ',
    calligraphyInfo: '\u0E19\u0E31\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2A\u0E48\u0E43\u0E08\u0E41\u0E25\u0E30\u0E17\u0E38\u0E48\u0E21\u0E40\u0E17 \u0E1C\u0E25\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E17\u0E32\u0E07\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E20\u0E32\u0E22\u0E43\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
    closing: 'ทีม Your Kanji Name'
  },
  vi: {
    subject: 'Yêu cầu thư pháp của bạn đã được nhận',
    greeting: 'Kính gửi',
    thankYou: 'Cảm ơn bạn đã gửi yêu cầu.',
    intro: 'Chúng tôi đã nhận được yêu cầu tác phẩm thư pháp tên kanji "{{kanjiName}}" của bạn.',
    yourName: 'Tên Kanji của bạn',
    calligraphyInfo: 'M\u1ED9t nh\u00e0 th\u01B0 ph\u00e1p chuy\u00ean nghi\u1EC7p s\u1EBD vi\u1EBFt t\u00ean b\u1EA1n v\u1EDBi s\u1EF1 t\u1EADn t\u00e2m. T\u00e1c ph\u1EA9m s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn email c\u1EE7a b\u1EA1n trong v\u00f2ng m\u1ED9t tu\u1EA7n.',
    closing: 'Đội ngũ Your Kanji Name'
  },
  id: {
    subject: 'Permintaan Kaligrafi Anda Telah Diterima',
    greeting: 'Yth.',
    thankYou: 'Terima kasih atas permintaan Anda.',
    intro: 'Kami telah menerima permintaan Anda untuk karya kaligrafi nama kanji Anda "{{kanjiName}}".',
    yourName: 'Nama Kanji Anda',
    calligraphyInfo: 'Seorang kaligrafer profesional akan menulis nama Anda dengan penuh perhatian dan dedikasi. Karya Anda akan dikirim ke email Anda dalam satu minggu.',
    closing: 'Tim Your Kanji Name'
  },
  ko: {
    subject: '서예 요청이 접수되었습니다',
    greeting: '안녕하세요',
    thankYou: '요청해 주셔서 감사합니다.',
    intro: '귀하의 한자 이름 "{{kanjiName}}" 서예 작품 요청이 접수되었습니다.',
    yourName: '당신의 한자 이름',
    calligraphyInfo: '\uc804\ubb38 \uc11c\uc608\uac00\uac00 \uc815\uc131\uc744 \ub2e4\ud574 \ub2f9\uc2e0\uc758 \uc774\ub984\uc744 \uc4f0\uaca0\uc2b5\ub2c8\ub2e4. \uc791\ud488\uc740 1\uc8fc\uc77c \uc774\ub0b4\uc5d0 \uc774\uba54\uc77c\ub85c \ubcf4\ub0b4\ub4dc\ub9bd\ub2c8\ub2e4.',
    closing: 'Your Kanji Name 팀'
  }
};

/**
 * Build user confirmation email HTML
 */
function buildUserEmailHtml(request, config) {
  const intro = config.intro.replace('{{kanjiName}}', request.kanji_name);

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
    .footer { text-align: center; padding: 20px 0; color: #888; font-size: 12px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://yourkanjiname.com/images/logo_color.svg" alt="Your Kanji Name" width="200">
    </div>
    <div class="content">
      <p>${config.greeting} ${request.user_name || ''},</p>
      <p>${config.thankYou}</p>
      <p>${intro}</p>

      <div style="text-align: center; padding: 30px 0;">
        <p style="color: #888; margin-bottom: 10px;">${config.yourName}</p>
        <div class="kanji-name">${request.kanji_name}</div>
      </div>

      <p>${config.calligraphyInfo}</p>
    </div>
    <div class="footer">
      <p>${config.closing}</p>
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
        <div class="value">${request.language || 'en'}</div>
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
    const request = { email, kanji_name, user_name, language, explanation_ja };

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
