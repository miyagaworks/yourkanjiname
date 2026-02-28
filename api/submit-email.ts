/**
 * Vercel Serverless Function: Submit Email (post-quiz)
 * Handles: POST /api/submit-email
 *
 * After quiz completion, receives user email, generates kanji name,
 * and schedules delivery email via Resend scheduledAt (5-10 min delay).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerationService } from '../src/services/GenerationService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setCorsHeaders, handlePreflight, isValidEmail } = require('./lib/security');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPool } = require('./lib/db');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  KANJI_NAME_EMAIL_CONFIG,
  buildUserEmailHtml,
  buildAdminEmailHtml,
  sendEmail
} = require('./lib/email');

export const maxDuration = 60; // Vercel Pro: allow up to 60s for generation

const generationService = new GenerationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);
  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST method is allowed' }
    });
  }

  try {
    const { session_id, email, user_name, language, payment_intent_id, partner_code } = req.body;

    // Validate required fields
    if (!session_id || !email) {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'session_id and email are required' }
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      });
    }

    // Wait for session to be ready (in case background session creation is still running)
    const dbPool = getPool();
    let sessionReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const check = await dbPool.query(
          'SELECT session_id FROM sessions WHERE session_id = $1',
          [session_id]
        );
        if (check.rows.length > 0) {
          sessionReady = true;
          break;
        }
      } catch {
        // DB might not be ready, continue waiting
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!sessionReady) {
      return res.status(422).json({
        error: { code: 'SESSION_NOT_READY', message: 'Session not found or not ready' }
      });
    }

    // Wait briefly for any pending answer submissions to arrive
    await new Promise(r => setTimeout(r, 2000));

    // Generate kanji name
    const lang = language || 'en';
    let kanjiResult;
    try {
      kanjiResult = await generationService.generateKanjiName(session_id as string);
    } catch (genError: unknown) {
      if ((genError as { code?: string }).code === 'INSUFFICIENT_ANSWERS') {
        // Answers may still be arriving, wait and retry once
        await new Promise(r => setTimeout(r, 3000));
        kanjiResult = await generationService.generateKanjiName(session_id as string);
      } else {
        throw genError;
      }
    }

    // Calculate random delay: 5-10 minutes
    const delayMinutes = Math.floor(Math.random() * 6) + 5;
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    // Build email content
    const config = KANJI_NAME_EMAIL_CONFIG[lang] || KANJI_NAME_EMAIL_CONFIG.en;
    const explanationUserLang = kanjiResult.explanation?.[lang] || kanjiResult.explanation?.en || '';
    const explanationJa = kanjiResult.explanation?.ja || '';

    const emailRequest = {
      email,
      kanji_name: kanjiResult.kanji_name,
      user_name: user_name || '',
      language: lang,
      explanation_ja: explanationJa,
      explanation_user_lang: explanationUserLang
    };

    const userEmailHtml = buildUserEmailHtml(emailRequest, config);

    // Schedule user email (5-10 min delay via Resend scheduledAt)
    const userEmailSent = await sendEmail(
      email,
      config.subject,
      userEmailHtml,
      scheduledAt.toISOString()
    );

    // Save to calligraphy_requests table for admin tracking
    try {
      await dbPool.query(
        `INSERT INTO calligraphy_requests (
          email, kanji_name, user_name, language, explanation_ja, explanation_user_lang, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [
          email,
          kanjiResult.kanji_name,
          user_name || null,
          lang,
          explanationJa || null,
          explanationUserLang || null
        ]
      );
    } catch (dbError) {
      console.error('Database save error:', (dbError as Error).message);
    }

    // Send admin notification immediately
    const adminEmail = process.env.ADMIN_EMAIL;
    let adminEmailSent = false;
    if (adminEmail) {
      const adminEmailHtml = buildAdminEmailHtml(emailRequest);
      adminEmailSent = await sendEmail(
        adminEmail,
        `【漢字名生成】${user_name || ''}様 - ${kanjiResult.kanji_name}`,
        adminEmailHtml
      );
    }

    console.log(`Email scheduled for ${email} at ${scheduledAt.toISOString()} (${delayMinutes} min delay)`);

    return res.json({
      success: true,
      message: 'Email scheduled successfully',
      emails: {
        user: userEmailSent,
        admin: adminEmailSent,
        scheduled_at: scheduledAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Submit email error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    });
  }
}
