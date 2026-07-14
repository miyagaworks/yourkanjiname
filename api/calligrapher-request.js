/**
 * Vercel Serverless Function: Calligrapher Request
 * Handles: POST /api/calligrapher-request
 *
 * Saves calligraphy requests and sends confirmation emails
 */

const { getPool } = require('./lib/db');
const { setCorsHeaders, handlePreflight, isValidEmail } = require('./lib/security');
const {
  CALLIGRAPHY_EMAIL_CONFIG,
  buildUserEmailHtml,
  buildAdminEmailHtml,
  sendEmail
} = require('./lib/email');

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
    const {
      email, kanji_name, user_name, language, explanation_ja, explanation_user_lang,
      payment_intent_id, partner_code
    } = req.body;

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

    // 決済記録とのつき合わせ用（M-4）。不正型・文字数超過はDB列の上限を超えないようNULL扱いにする。
    const sanitizeBoundedString = (value, maxLength) =>
      (typeof value === 'string' && value.length > 0 && value.length <= maxLength) ? value : null;
    const validatedPaymentIntentId = sanitizeBoundedString(payment_intent_id, 100);
    const validatedPartnerCode = sanitizeBoundedString(partner_code, 20);

    // Save to database
    const dbPool = getPool();
    const insertQuery = `
      INSERT INTO calligraphy_requests (
        email, kanji_name, user_name, language, explanation_ja, explanation_user_lang,
        payment_intent_id, partner_code, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
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
        explanation_user_lang || null,
        validatedPaymentIntentId,
        validatedPartnerCode
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
    const config = CALLIGRAPHY_EMAIL_CONFIG[language] || CALLIGRAPHY_EMAIL_CONFIG.en;
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
