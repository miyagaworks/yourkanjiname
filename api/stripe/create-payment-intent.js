/**
 * Create Payment Intent API
 * POST /api/stripe/create-payment-intent
 * Vercel Serverless Function
 *
 * Creates a Stripe PaymentIntent for kanji name generation
 */

const Stripe = require('stripe');
const { Pool } = require('pg');

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

  try {
    const { session_id, partner_code, customer_email, kanji_name } = req.body;

    // session_id is optional - payment can happen before session creation
    const dbPool = getPool();
    let partnerId = null;
    let partnerRoyaltyRate = 0.10;

    // Look up partner if code provided
    if (partner_code) {
      const partnerResult = await dbPool.query(
        'SELECT id, royalty_rate FROM partners WHERE code = $1 AND status = $2',
        [partner_code, 'active']
      );
      if (partnerResult.rows.length > 0) {
        partnerId = partnerResult.rows[0].id;
        partnerRoyaltyRate = parseFloat(partnerResult.rows[0].royalty_rate);
      }
    }

    // Amount is $5.00 = 500 cents
    const amount = 500;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        session_id: session_id || '',
        partner_code: partner_code || '',
        partner_id: partnerId ? partnerId.toString() : '',
        kanji_name: kanji_name || ''
      },
      receipt_email: customer_email || undefined,
    });

    // Record pending payment in database
    await dbPool.query(
      `INSERT INTO payments (
        session_id, stripe_payment_intent_id, amount, currency, status,
        partner_code, partner_id, customer_email, kanji_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        session_id || null,
        paymentIntent.id,
        5.00,
        'usd',
        'pending',
        partner_code || null,
        partnerId,
        customer_email || null,
        kanji_name || null
      ]
    );

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
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
