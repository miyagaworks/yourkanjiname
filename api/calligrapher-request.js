/**
 * Vercel Serverless Function: Calligrapher Request
 * Handles: POST /api/calligrapher-request
 *
 * Saves calligraphy requests and sends confirmation emails
 */

const { getPool } = require('./lib/db');
const { setCorsHeaders, handlePreflight, isValidEmail } = require('./lib/security');

// Language code to name mapping (for admin email)
const LANGUAGE_NAMES = {
  ja: '日本語',
  en: '英語 (English)',
  fr: 'フランス語 (Français)',
  de: 'ドイツ語 (Deutsch)',
  es: 'スペイン語 (Español)',
  pt: 'ポルトガル語 (Português)',
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
    calligraphyInfo: 'プロの書道家が心を込めて筆で書き上げ、1週間以内にメールでお届けいたします。',
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
    calligraphyInfo: 'A professional calligrapher will write your name with care and dedication. Your artwork will be delivered to your email within one week.',
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
    calligraphyInfo: 'Un calligraphe professionnel \u00e9crira votre nom avec soin et d\u00e9vouement. Votre \u0153uvre vous sera envoy\u00e9e par e-mail sous une semaine.',
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
    calligraphyInfo: 'Ein professioneller Kalligraph wird Ihren Namen mit Sorgfalt und Hingabe schreiben. Ihr Kunstwerk wird Ihnen innerhalb einer Woche per E-Mail zugesandt.',
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
    calligraphyInfo: 'Un cal\u00edgrafo profesional escribir\u00e1 su nombre con cuidado y dedicaci\u00f3n. Su obra ser\u00e1 enviada a su correo electr\u00f3nico en un plazo de una semana.',
    closing: 'El equipo de Your Kanji Name',
    contact: 'Contacto'
  },
  pt: {
    subject: 'Sua solicita\u00e7\u00e3o de caligrafia foi recebida',
    greeting: 'Prezado(a)',
    thankYou: 'Obrigado pela sua solicita\u00e7\u00e3o.',
    intro: 'Recebemos sua solicita\u00e7\u00e3o de uma obra caligr\u00e1fica do seu nome em kanji "{{kanjiName}}".',
    yourName: 'Seu nome em kanji',
    aboutYourName: 'Sobre seu nome em kanji',
    calligraphyInfo: 'Um cal\u00edgrafo profissional escrever\u00e1 seu nome com cuidado e dedica\u00e7\u00e3o. Sua obra ser\u00e1 enviada para o seu e-mail dentro de uma semana.',
    closing: 'Equipe Your Kanji Name',
    contact: 'Contato'
  },
  it: {
    subject: 'La tua richiesta di calligrafia è stata ricevuta',
    greeting: 'Gentile',
    thankYou: 'Grazie per la tua richiesta.',
    intro: 'Abbiamo ricevuto la tua richiesta per un\'opera calligrafica del tuo nome kanji "{{kanjiName}}".',
    yourName: 'Il tuo nome in kanji',
    aboutYourName: 'Informazioni sul tuo nome in kanji',
    calligraphyInfo: 'Un calligrafo professionista scriver\u00e0 il tuo nome con cura e dedizione. La tua opera ti sar\u00e0 inviata via e-mail entro una settimana.',
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
    calligraphyInfo: '\u0E19\u0E31\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E1E\u0E39\u0E48\u0E01\u0E31\u0E19\u0E21\u0E37\u0E2D\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E08\u0E30\u0E40\u0E02\u0E35\u0E22\u0E19\u0E0A\u0E37\u0E48\u0E2D\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2A\u0E48\u0E43\u0E08\u0E41\u0E25\u0E30\u0E17\u0E38\u0E48\u0E21\u0E40\u0E17 \u0E1C\u0E25\u0E07\u0E32\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E17\u0E32\u0E07\u0E2D\u0E35\u0E40\u0E21\u0E25\u0E20\u0E32\u0E22\u0E43\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
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
    calligraphyInfo: 'M\u1ED9t nh\u00e0 th\u01B0 ph\u00e1p chuy\u00ean nghi\u1EC7p s\u1EBD vi\u1EBFt t\u00ean b\u1EA1n v\u1EDBi s\u1EF1 t\u1EADn t\u00e2m. T\u00e1c ph\u1EA9m s\u1EBD \u0111\u01B0\u1EE3c g\u1EEDi \u0111\u1EBFn email c\u1EE7a b\u1EA1n trong v\u00f2ng m\u1ED9t tu\u1EA7n.',
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
    calligraphyInfo: 'Seorang kaligrafer profesional akan menulis nama Anda dengan penuh perhatian dan dedikasi. Karya Anda akan dikirim ke email Anda dalam satu minggu.',
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
    calligraphyInfo: '\uc804\ubb38 \uc11c\uc608\uac00\uac00 \uc815\uc131\uc744 \ub2e4\ud574 \ub2f9\uc2e0\uc758 \uc774\ub984\uc744 \uc4f0\uaca0\uc2b5\ub2c8\ub2e4. \uc791\ud488\uc740 1\uc8fc\uc77c \uc774\ub0b4\uc5d0 \uc774\uba54\uc77c\ub85c \ubcf4\ub0b4\ub4dc\ub9bd\ub2c8\ub2e4.',
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
</head>
<body style="margin:0;padding:0;background-color:#f4f2ef;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ef;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:32px 40px;text-align:center;border-bottom:1px solid #f0ece8;">
              <img src="https://app.kanjiname.jp/images/logo_color.png" alt="Your Kanji Name" width="260" style="max-width:100%;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 16px;">
              ${greeting ? `<p style="margin:0 0 12px;font-size:16px;color:#333;">${greeting}</p>` : ''}
              <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.9;">${config.thankYou}</p>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.9;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" style="background:#faf8f5;border-radius:16px;padding:28px 40px;width:100%;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">${config.yourName}</p>
                    <p style="margin:0;font-size:52px;color:#c75450;font-weight:700;letter-spacing:0.1em;">${request.kanji_name}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${explanationHtml ? `
          <tr>
            <td style="padding:16px 40px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#c75450;letter-spacing:0.05em;">${config.aboutYourName}</p>
              <div style="font-size:14px;color:#555;line-height:2;border-left:3px solid #c75450;padding-left:16px;">${explanationHtml}</div>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 40px 32px;">
              <p style="margin:0;font-size:14px;color:#555;line-height:1.9;">${config.calligraphyInfo}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #f0ece8;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#aaa;">${config.closing}</p>
              <p style="margin:0 0 4px;font-size:12px;color:#aaa;">${config.contact}: <a href="mailto:contact@kanjiname.jp" style="color:#c75450;text-decoration:none;">contact@kanjiname.jp</a></p>
              <p style="margin:0;font-size:11px;color:#ccc;">&copy; ${new Date().getFullYear()} Your Kanji Name</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f2ef;font-family:'Helvetica Neue',Arial,'Noto Sans JP',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ef;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#c75450,#a33f3c);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.05em;">新しい書道申込</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 8px;" align="center">
              <p style="margin:0 0 8px;font-size:12px;color:#999;letter-spacing:0.1em;">漢字名</p>
              <p style="margin:0;font-size:44px;color:#c75450;font-weight:700;letter-spacing:0.1em;">${request.kanji_name}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">申込者名</span>
                    <span style="font-size:16px;color:#333;font-weight:600;">${request.user_name || '(未入力)'}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #f0ece8;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">メールアドレス</span>
                    <a href="mailto:${request.email}" style="font-size:16px;color:#c75450;text-decoration:none;">${request.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0;">
                    <span style="display:block;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">選択言語</span>
                    <span style="font-size:16px;color:#333;">${LANGUAGE_NAMES[request.language] || LANGUAGE_NAMES.en}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${request.explanation_ja ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#c75450;letter-spacing:0.05em;">説明文（日本語）</p>
              <div style="font-size:13px;color:#555;line-height:1.9;border-left:3px solid #c75450;padding-left:16px;white-space:pre-wrap;">${request.explanation_ja}</div>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:0 40px 32px;" align="center">
              <a href="mailto:${request.email}" style="display:inline-block;background:#c75450;color:#ffffff;padding:12px 32px;border-radius:50px;font-size:14px;font-weight:600;text-decoration:none;">返信する</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send email using Resend API
 */
async function sendEmail(to, subject, html) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@kanjiname.jp>';

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
