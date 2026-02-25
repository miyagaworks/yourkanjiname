/**
 * Admin Send Calligraphy API
 * POST /api/admin/send-calligraphy
 * Sends the calligraphy image to the user via email
 */

const { getPool } = require('../lib/db');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

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
    shareTitle: 'あなたの漢字ストーリーをシェアしよう',
    shareText: '漢字名の写真を撮って、友人に見せてみましょう！',
    shareTemplate: '私の漢字名は {{kanjiName}} です',
    feedbackTitle: 'ご感想をお聞かせください',
    feedbackText: '体験はいかがでしたか？ぜひレビューで教えてください。',
    feedbackLoved: 'レビューを書く',
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
    shareTitle: 'Share your kanji story',
    shareText: 'Snap a photo of your calligraphy and show your friends!',
    shareTemplate: 'My name in kanji is {{kanjiName}}',
    feedbackTitle: 'Love your kanji name?',
    feedbackText: 'Your review helps other travelers discover this beautiful tradition.',
    feedbackLoved: 'Leave a Review',
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
    shareTitle: 'Partagez votre histoire kanji',
    shareText: 'Prenez une photo de votre calligraphie et montrez-la à vos amis !',
    shareTemplate: 'Mon nom en kanji est {{kanjiName}}',
    feedbackTitle: 'Vous aimez votre nom en kanji ?',
    feedbackText: 'Votre avis aide d\'autres voyageurs à découvrir cette belle tradition.',
    feedbackLoved: 'Laisser un avis',
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
    shareTitle: 'Teilen Sie Ihre Kanji-Geschichte',
    shareText: 'Machen Sie ein Foto Ihrer Kalligraphie und zeigen Sie es Ihren Freunden!',
    shareTemplate: 'Mein Name in Kanji ist {{kanjiName}}',
    feedbackTitle: 'Gefällt Ihnen Ihr Kanji-Name?',
    feedbackText: 'Ihre Bewertung hilft anderen Reisenden, diese schöne Tradition zu entdecken.',
    feedbackLoved: 'Bewertung schreiben',
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
    shareTitle: 'Comparta su historia kanji',
    shareText: '¡Tome una foto de su caligrafía y muéstrela a sus amigos!',
    shareTemplate: 'Mi nombre en kanji es {{kanjiName}}',
    feedbackTitle: '¿Le gusta su nombre en kanji?',
    feedbackText: 'Su reseña ayuda a otros viajeros a descubrir esta hermosa tradición.',
    feedbackLoved: 'Dejar una reseña',
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
    shareTitle: 'Condividi la tua storia kanji',
    shareText: 'Scatta una foto della tua calligrafia e mostrala ai tuoi amici!',
    shareTemplate: 'Il mio nome in kanji è {{kanjiName}}',
    feedbackTitle: 'Ti piace il tuo nome in kanji?',
    feedbackText: 'La tua recensione aiuta altri viaggiatori a scoprire questa bella tradizione.',
    feedbackLoved: 'Lascia una recensione',
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
    shareTitle: 'แชร์เรื่องราวคันจิของคุณ',
    shareText: 'ถ่ายรูปผลงานพู่กันและโชว์ให้เพื่อนๆ ดู!',
    shareTemplate: 'ชื่อของฉันในอักษรคันจิคือ {{kanjiName}}',
    feedbackTitle: 'ชอบชื่อคันจิของคุณไหม?',
    feedbackText: 'รีวิวของคุณช่วยให้นักท่องเที่ยวคนอื่นค้นพบประเพณีอันงดงามนี้',
    feedbackLoved: 'เขียนรีวิว',
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
    shareTitle: 'Chia sẻ câu chuyện kanji của bạn',
    shareText: 'Chụp ảnh tác phẩm thư pháp và khoe với bạn bè!',
    shareTemplate: 'Tên tôi bằng chữ kanji là {{kanjiName}}',
    feedbackTitle: 'Bạn thích tên kanji của mình không?',
    feedbackText: 'Đánh giá của bạn giúp du khách khác khám phá truyền thống tuyệt đẹp này.',
    feedbackLoved: 'Viết đánh giá',
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
    shareTitle: 'Bagikan cerita kanji Anda',
    shareText: 'Foto karya kaligrafi Anda dan tunjukkan ke teman-teman!',
    shareTemplate: 'Nama saya dalam kanji adalah {{kanjiName}}',
    feedbackTitle: 'Suka nama kanji Anda?',
    feedbackText: 'Ulasan Anda membantu wisatawan lain menemukan tradisi indah ini.',
    feedbackLoved: 'Tulis ulasan',
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
    shareTitle: '당신의 한자 이야기를 공유하세요',
    shareText: '서예 작품 사진을 찍어 친구들에게 보여주세요!',
    shareTemplate: '제 이름의 한자는 {{kanjiName}}입니다',
    feedbackTitle: '한자 이름이 마음에 드시나요?',
    feedbackText: '리뷰가 다른 여행자들이 이 아름다운 전통을 발견하는 데 도움이 됩니다.',
    feedbackLoved: '리뷰 작성하기',
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
    ? `
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#c75450;letter-spacing:0.05em;">${config.poemTitle}</p>
              <div style="font-size:14px;color:#555;line-height:2;background:#faf8f5;padding:20px 24px;border-radius:12px;border-left:3px solid #c75450;white-space:pre-wrap;">${poemText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </td>
          </tr>`
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
              <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.9;">${intro}</p>
              <p style="margin:0;font-size:14px;color:#555;line-height:1.9;">${config.message}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" style="background:#faf8f5;border-radius:16px;padding:24px;width:100%;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 16px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">${config.yourArtwork}</p>
                    <img src="${imageUrl}" alt="${request.kanji_name}" style="max-width:100%;border-radius:8px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${poemHtml}
          <tr>
            <td style="padding:16px 40px 24px;">
              <div style="font-size:12px;color:#888;background:#fff9e6;padding:16px 20px;border-radius:8px;line-height:1.8;">${config.note}</div>
            </td>
          </tr>
          <!-- Your Kanji Story + SNS Share Section -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table cellpadding="0" cellspacing="0" style="background:#faf8f5;border-radius:12px;padding:24px;width:100%;">
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#c75450;letter-spacing:0.03em;">${config.shareTitle}</p>
                    <p style="margin:0 0 14px;font-size:14px;color:#555;line-height:1.7;">${config.shareText}</p>
                    <!-- Copy-paste template for SNS -->
                    <div style="background:#ffffff;border:1px solid #f0ece8;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
                      <p style="margin:0;font-size:14px;color:#333;line-height:1.7;font-style:italic;">"${config.shareTemplate.replace('{{kanjiName}}', request.kanji_name)}"</p>
                    </div>
                    <p style="margin:0;">
                      <span style="display:inline-block;background:#ffffff;border:1px solid #f0ece8;color:#c75450;padding:6px 14px;border-radius:20px;font-weight:600;font-size:13px;margin-right:6px;">#MyKanjiName</span>
                      <span style="display:inline-block;background:#ffffff;border:1px solid #f0ece8;color:#c75450;padding:6px 14px;border-radius:20px;font-weight:600;font-size:13px;">@yourkanjiname</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Review CTA Section -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table cellpadding="0" cellspacing="0" style="border:1px solid #f0ece8;border-radius:12px;padding:24px;width:100%;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#333;">${config.feedbackTitle}</p>
                    <p style="margin:0 0 18px;font-size:13px;color:#888;">${config.feedbackText}</p>
                    <a href="https://g.page/r/Cft5gcCZVQfoEAI/review" style="display:inline-block;background:#c75450;color:#ffffff;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">${config.feedbackLoved}</a>
                  </td>
                </tr>
              </table>
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

async function sendEmail(to, subject, html) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Your Kanji Name <noreply@kanjiname.jp>';

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
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
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
