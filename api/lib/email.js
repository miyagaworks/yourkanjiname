/**
 * Shared Email Utilities
 * Common email sending, HTML builders, and per-language configuration
 */

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

// Email configuration per language for calligraphy request confirmation
const CALLIGRAPHY_EMAIL_CONFIG = {
  ja: {
    subject: '書道作品のお申し込みを受け付けました',
    greeting: '様',
    greetingFormat: 'name_first',
    thankYou: 'お申し込みいただきありがとうございます。',
    intro: 'あなたの漢字名「{{kanjiName}}」の書道作品のお申し込みを受け付けました。',
    yourName: 'あなたの漢字名',
    aboutYourName: '漢字名について',
    calligraphyInfo: 'プロの書道家が心を込めて筆で書き上げ、3営業日以内（土日祝は除く）にメールでお届けいたします。',
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
    calligraphyInfo: 'A professional calligrapher will write your name with care and dedication. Your artwork will be delivered to your email within 3 business days (excl. weekends/holidays).',
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
    calligraphyInfo: 'Un calligraphe professionnel écrira votre nom avec soin et dévouement. Votre œuvre vous sera envoyée par e-mail sous 3 jours ouvrés (hors week-ends/jours fériés).',
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
    calligraphyInfo: 'Ein professioneller Kalligraph wird Ihren Namen mit Sorgfalt und Hingabe schreiben. Ihr Kunstwerk wird Ihnen innerhalb von 3 Werktagen (ohne Wochenenden/Feiertage) per E-Mail zugesandt.',
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
    calligraphyInfo: 'Un calígrafo profesional escribirá su nombre con cuidado y dedicación. Su obra será enviada a su correo electrónico en un plazo de 3 días hábiles (excl. fines de semana/festivos).',
    closing: 'El equipo de Your Kanji Name',
    contact: 'Contacto'
  },
  pt: {
    subject: 'Sua solicitação de caligrafia foi recebida',
    greeting: 'Prezado(a)',
    thankYou: 'Obrigado pela sua solicitação.',
    intro: 'Recebemos sua solicitação de uma obra caligráfica do seu nome em kanji "{{kanjiName}}".',
    yourName: 'Seu nome em kanji',
    aboutYourName: 'Sobre seu nome em kanji',
    calligraphyInfo: 'Um calígrafo profissional escreverá seu nome com cuidado e dedicação. Sua obra será enviada para o seu e-mail dentro de 3 dias úteis (excl. fins de semana/feriados).',
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
    calligraphyInfo: 'Un calligrafo professionista scriverà il tuo nome con cura e dedizione. La tua opera ti sarà inviata via e-mail entro 3 giorni lavorativi (esclusi weekend/festivi).',
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
    calligraphyInfo: 'นักเขียนพู่กันมืออาชีพจะเขียนชื่อของคุณด้วยความใส่ใจและทุ่มเท ผลงานจะถูกส่งทางอีเมลภายใน 3 วันทำการ (ไม่รวมวันหยุดสุดสัปดาห์/วันหยุดนักขัตฤกษ์)',
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
    calligraphyInfo: 'Một nhà thư pháp chuyên nghiệp sẽ viết tên bạn với sự tận tâm. Tác phẩm sẽ được gửi đến email của bạn trong vòng 3 ngày làm việc (không tính cuối tuần/ngày lễ).',
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
    calligraphyInfo: 'Seorang kaligrafer profesional akan menulis nama Anda dengan penuh perhatian dan dedikasi. Karya Anda akan dikirim ke email Anda dalam 3 hari kerja (tidak termasuk akhir pekan/hari libur).',
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
    calligraphyInfo: '전문 서예가가 정성을 다해 당신의 이름을 쓰겠습니다. 작품은 3영업일 이내(주말/공휴일 제외)에 이메일로 보내드립니다.',
    closing: 'Your Kanji Name 팀',
    contact: '문의'
  }
};

// Email configuration for kanji name delivery (sent after generation)
const KANJI_NAME_EMAIL_CONFIG = {
  ja: {
    subject: 'あなたの漢字名が届きました',
    greeting: '様',
    greetingFormat: 'name_first',
    thankYou: 'お待たせいたしました。',
    intro: 'あなたにピッタリの漢字名「{{kanjiName}}」が完成いたしました。',
    yourName: 'あなたの漢字名',
    aboutYourName: '漢字名について',
    calligraphyInfo: '書道家による手書きの書道作品は3営業日以内（土日祝は除く）にメールでお届けいたします。',
    closing: 'Your Kanji Name チーム',
    contact: 'お問い合わせ'
  },
  en: {
    subject: 'Your Kanji Name Has Arrived',
    greeting: 'Dear',
    thankYou: 'Thank you for your patience.',
    intro: 'Your perfect kanji name "{{kanjiName}}" is ready!',
    yourName: 'Your Kanji Name',
    aboutYourName: 'About Your Kanji Name',
    calligraphyInfo: 'Your handwritten calligraphy by our calligrapher will be delivered within 3 business days (excl. weekends/holidays).',
    closing: 'Your Kanji Name Team',
    contact: 'Contact'
  },
  fr: {
    subject: 'Votre nom en kanji est arrivé',
    greeting: 'Cher/Chère',
    thankYou: 'Merci de votre patience.',
    intro: 'Votre nom kanji parfait « {{kanjiName}} » est prêt !',
    yourName: 'Votre nom en kanji',
    aboutYourName: 'À propos de votre nom en kanji',
    calligraphyInfo: 'Votre calligraphie manuscrite sera livrée sous 3 jours ouvrés (hors week-ends/jours fériés).',
    closing: 'L\'équipe Your Kanji Name',
    contact: 'Contact'
  },
  de: {
    subject: 'Ihr Kanji-Name ist angekommen',
    greeting: 'Sehr geehrte/r',
    thankYou: 'Vielen Dank für Ihre Geduld.',
    intro: 'Ihr perfekter Kanji-Name „{{kanjiName}}" ist fertig!',
    yourName: 'Ihr Kanji-Name',
    aboutYourName: 'Über Ihren Kanji-Namen',
    calligraphyInfo: 'Ihre handgeschriebene Kalligraphie wird innerhalb von 3 Werktagen (ohne Wochenenden/Feiertage) per E-Mail zugesandt.',
    closing: 'Das Your Kanji Name Team',
    contact: 'Kontakt'
  },
  es: {
    subject: 'Tu nombre en kanji ha llegado',
    greeting: 'Estimado/a',
    thankYou: 'Gracias por su paciencia.',
    intro: '¡Su nombre kanji perfecto "{{kanjiName}}" está listo!',
    yourName: 'Su nombre en kanji',
    aboutYourName: 'Sobre su nombre en kanji',
    calligraphyInfo: 'Su caligrafía manuscrita será enviada en un plazo de 3 días hábiles (excl. fines de semana/festivos).',
    closing: 'El equipo de Your Kanji Name',
    contact: 'Contacto'
  },
  pt: {
    subject: 'Seu nome em kanji chegou',
    greeting: 'Prezado(a)',
    thankYou: 'Obrigado pela sua paciência.',
    intro: 'Seu nome kanji perfeito "{{kanjiName}}" está pronto!',
    yourName: 'Seu nome em kanji',
    aboutYourName: 'Sobre seu nome em kanji',
    calligraphyInfo: 'Sua caligrafia manuscrita será enviada dentro de 3 dias úteis (excl. fins de semana/feriados).',
    closing: 'Equipe Your Kanji Name',
    contact: 'Contato'
  },
  it: {
    subject: 'Il tuo nome in kanji è arrivato',
    greeting: 'Gentile',
    thankYou: 'Grazie per la tua pazienza.',
    intro: 'Il tuo nome kanji perfetto "{{kanjiName}}" è pronto!',
    yourName: 'Il tuo nome in kanji',
    aboutYourName: 'Informazioni sul tuo nome in kanji',
    calligraphyInfo: 'La tua calligrafia scritta a mano sarà consegnata entro 3 giorni lavorativi (esclusi weekend/festivi).',
    closing: 'Il team di Your Kanji Name',
    contact: 'Contatto'
  },
  th: {
    subject: 'ชื่อคันจิของคุณมาถึงแล้ว',
    greeting: 'เรียน',
    thankYou: 'ขอบคุณสำหรับความอดทนของคุณ',
    intro: 'ชื่อคันจิที่เหมาะกับคุณ "{{kanjiName}}" พร้อมแล้ว!',
    yourName: 'ชื่อคันจิของคุณ',
    aboutYourName: 'เกี่ยวกับชื่อคันจิของคุณ',
    calligraphyInfo: 'งานเขียนพู่กันด้วยมือจะถูกส่งภายใน 3 วันทำการ (ไม่รวมวันหยุดสุดสัปดาห์/วันหยุดนักขัตฤกษ์)',
    closing: 'ทีม Your Kanji Name',
    contact: 'ติดต่อ'
  },
  vi: {
    subject: 'Tên kanji của bạn đã sẵn sàng',
    greeting: 'Kính gửi',
    thankYou: 'Cảm ơn bạn đã kiên nhẫn chờ đợi.',
    intro: 'Tên kanji hoàn hảo của bạn "{{kanjiName}}" đã sẵn sàng!',
    yourName: 'Tên Kanji của bạn',
    aboutYourName: 'Về tên Kanji của bạn',
    calligraphyInfo: 'Tác phẩm thư pháp viết tay sẽ được gửi trong vòng 3 ngày làm việc (không tính cuối tuần/ngày lễ).',
    closing: 'Đội ngũ Your Kanji Name',
    contact: 'Liên hệ'
  },
  id: {
    subject: 'Nama kanji Anda telah tiba',
    greeting: 'Yth.',
    thankYou: 'Terima kasih atas kesabaran Anda.',
    intro: 'Nama kanji sempurna Anda "{{kanjiName}}" sudah siap!',
    yourName: 'Nama Kanji Anda',
    aboutYourName: 'Tentang Nama Kanji Anda',
    calligraphyInfo: 'Karya kaligrafi tulisan tangan akan dikirim dalam 3 hari kerja (tidak termasuk akhir pekan/hari libur).',
    closing: 'Tim Your Kanji Name',
    contact: 'Kontak'
  },
  ko: {
    subject: '당신의 한자 이름이 도착했습니다',
    greeting: '안녕하세요',
    thankYou: '기다려 주셔서 감사합니다.',
    intro: '당신에게 딱 맞는 한자 이름 "{{kanjiName}}"이 완성되었습니다!',
    yourName: '당신의 한자 이름',
    aboutYourName: '당신의 한자 이름에 대하여',
    calligraphyInfo: '손글씨 서예 작품은 3영업일 이내(주말/공휴일 제외)에 이메일로 보내드립니다.',
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
    return name ? `${name}${config.greeting}` : '';
  }
  return name ? `${config.greeting} ${name},` : '';
}

/**
 * Build user email HTML (used for both calligraphy confirmation and kanji name delivery)
 */
function buildUserEmailHtml(request, config) {
  const intro = config.intro.replace('{{kanjiName}}', request.kanji_name);
  const greeting = buildGreeting(config, request.user_name);

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
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - email HTML body
 * @param {string} [scheduledAt] - ISO 8601 datetime for scheduled sending (optional)
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendEmail(to, subject, html, scheduledAt) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@kanjiname.jp>';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email to:', to);
    return false;
  }

  try {
    const payload = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: html
    };

    if (scheduledAt) {
      payload.scheduled_at = scheduledAt;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log('Email sent successfully to:', to, scheduledAt ? `(scheduled: ${scheduledAt})` : '');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

module.exports = {
  LANGUAGE_NAMES,
  CALLIGRAPHY_EMAIL_CONFIG,
  KANJI_NAME_EMAIL_CONFIG,
  buildGreeting,
  buildUserEmailHtml,
  buildAdminEmailHtml,
  sendEmail
};
