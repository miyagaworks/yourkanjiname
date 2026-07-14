/**
 * Vercel Serverless Function: Session Management
 * Handles: POST /api/sessions, GET /api/sessions/[id], GET /api/sessions/[id]/next-question
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { SessionService } from '../src/services/SessionService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setCorsHeaders, handlePreflight } = require('./lib/security');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { verifyPaymentIntent } = require('./lib/payment-verification');

const sessionService = new SessionService();

// 強制モード（PAYMENT_CHECK_MODE='enforce'）のときに402で拒否する判定コード。
// それ以外は記録モード：どの判定コードでもセッションは作成し列に記録するだけ。
// 参照: docs/bug-audit-2026-07-13.md M-5 フェイルセーフのトレース表
const PAYMENT_REJECT_CODES = new Set([
  'missing',
  'rejected_format',
  'rejected_not_found',
  'rejected_not_paid',
  'rejected_demo',
  'rejected_skip'
]);

// Vercelログで観測するためconsole.warnする判定コード（全文は出さずprefixのみ出力）
const PAYMENT_WARN_CODES = new Set([
  'missing',
  'rejected_format',
  'rejected_not_found',
  'rejected_not_paid',
  'rejected_demo',
  'rejected_skip',
  'fail_open_stripe',
  'fail_open_db'
]);

function paymentIntentIdPrefix(rawPaymentIntentId: unknown): string {
  return typeof rawPaymentIntentId === 'string' ? rawPaymentIntentId.slice(0, 12) : String(rawPaymentIntentId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  // Handle preflight
  if (handlePreflight(req, res)) return;

  try {
    const { action, session_id } = req.query;

    // POST /api/sessions - Create new session
    if (req.method === 'POST' && !session_id) {
      const sessionId = uuidv4();
      const ipAddress = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
      const userAgent = req.headers['user-agent'];
      const userName = req.body?.user_name;
      const rawPaymentIntentId = req.body?.payment_intent_id;

      // 決済検証（M-5）。この関数はthrowしない（検証不能時はfail_open_*を返す）。
      const verification = await verifyPaymentIntent(rawPaymentIntentId);

      if (PAYMENT_WARN_CODES.has(verification.code)) {
        console.warn(
          `[sessions] payment_verification=${verification.code} payment_intent_id_prefix=${paymentIntentIdPrefix(rawPaymentIntentId)}`
        );
      }

      // PAYMENT_CHECK_MODE='enforce' のときのみ拒否判定を402で弾く。未設定時は記録モード。
      const enforceMode = process.env.PAYMENT_CHECK_MODE === 'enforce';
      if (enforceMode && PAYMENT_REJECT_CODES.has(verification.code)) {
        return res.status(402).json({
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'Payment verification failed'
          }
        });
      }

      const session = await sessionService.createSession(
        sessionId,
        ipAddress,
        userAgent,
        userName,
        verification.storableId,
        verification.code
      );

      // 決済記録との紐付け（M-4）。失敗してもtry/catchで握り、セッション作成は成功させる。
      try {
        if (verification.system === 'stripe' && verification.storableId) {
          await sessionService.linkStripePayment(session.session_id, verification.storableId);
        } else if (verification.system === 'demo' && verification.demoCode) {
          const linked = await sessionService.linkDemoUsage(session.session_id, verification.demoCode);
          if (!linked) {
            console.warn(
              `[sessions] payment_verification=demo_unlinked payment_intent_id_prefix=${paymentIntentIdPrefix(rawPaymentIntentId)}`
            );
            await sessionService.updatePaymentVerification(session.session_id, 'demo_unlinked');
          }
        }
      } catch (linkError) {
        console.error('Payment linking post-processing failed:', linkError);
      }

      return res.status(201).json({
        session_id: session.session_id,
        created_at: session.created_at,
        current_question_id: 'Q0'
      });
    }

    // GET /api/sessions?session_id=xxx&action=next-question
    if (req.method === 'GET' && session_id && action === 'next-question') {
      const lang = (req.query.lang as string) || 'ja';

      const session = await sessionService.getSession(session_id as string);

      if (!session) {
        return res.status(404).json({
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The specified session does not exist'
          }
        });
      }

      if (session.completed) {
        return res.status(409).json({
          error: {
            code: 'SESSION_COMPLETED',
            message: 'This session has already been completed'
          }
        });
      }

      const nextQuestion = await sessionService.getNextQuestion(session_id as string, lang);

      return res.json(nextQuestion);
    }

    // GET /api/sessions?session_id=xxx - Get session info
    if (req.method === 'GET' && session_id && !action) {
      const session = await sessionService.getSession(session_id as string);

      if (!session) {
        return res.status(404).json({
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The specified session does not exist'
          }
        });
      }

      const answersCount = await sessionService.getAnswersCount(session_id as string);

      return res.json({
        session_id: session.session_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed: session.completed,
        answers_count: answersCount
      });
    }

    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    });
  }
}
