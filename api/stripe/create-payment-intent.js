/**
 * Create Payment Intent API
 * POST /api/stripe/create-payment-intent
 * Vercel Serverless Function
 *
 * Creates a Stripe PaymentIntent for kanji name generation
 */

const Stripe = require('stripe');
const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, isValidUUID, isValidEmail } = require('../_utils/security');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { session_id, partner_code, customer_email, kanji_name } = req.body;

    // Validate inputs
    const validatedSessionId = session_id && isValidUUID(session_id) ? session_id : null;
    const validatedEmail = customer_email && isValidEmail(customer_email) ? customer_email : null;

    const dbPool = getPool();
    let partnerId = null;
    let partnerRoyaltyRate = 0.10;
    let priceUsd = 5.00; // Default price

    // Look up partner if code provided
    if (partner_code) {
      const partnerResult = await dbPool.query(
        'SELECT id, royalty_rate, price_usd FROM partners WHERE code = $1 AND status = $2',
        [partner_code, 'active']
      );
      if (partnerResult.rows.length > 0) {
        partnerId = partnerResult.rows[0].id;
        partnerRoyaltyRate = parseFloat(partnerResult.rows[0].royalty_rate);
        priceUsd = parseFloat(partnerResult.rows[0].price_usd) || 5.00;
      }
    }

    // Amount in cents
    const amount = Math.round(priceUsd * 100);

    // Warn if partner code was provided but not found (for debugging)
    const partnerNotFound = partner_code && !partnerId;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        session_id: validatedSessionId || '',
        partner_code: partner_code || '',
        partner_id: partnerId ? partnerId.toString() : '',
        kanji_name: kanji_name || ''
      },
      receipt_email: validatedEmail || undefined,
    });

    // Note: Payment record will be created when payment succeeds (via webhook or confirmation)
    // We no longer create pending records to avoid orphaned entries

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      priceUsd: priceUsd,
      partnerApplied: !!partnerId,
      partnerNotFound: partnerNotFound
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    return res.status(500).json({
      error: {
        code: 'PAYMENT_ERROR',
        message: error.message || 'Failed to create payment intent'
      }
    });
  }
};
