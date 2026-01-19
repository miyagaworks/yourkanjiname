/**
 * Stripe Webhook Handler
 * POST /api/stripe/webhook
 * Vercel Serverless Function
 *
 * Handles Stripe webhook events for payment processing
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

// Disable body parsing for webhook to get raw body
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Update monthly stats for partner
 */
async function updatePartnerMonthlyStats(dbPool, partnerId, amount, royaltyRate) {
  const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const royaltyAmount = parseFloat(amount) * parseFloat(royaltyRate);

  await dbPool.query(`
    INSERT INTO partner_monthly_stats (partner_id, year_month, total_payments, total_revenue, royalty_amount)
    VALUES ($1, $2, 1, $3, $4)
    ON CONFLICT (partner_id, year_month)
    DO UPDATE SET
      total_payments = partner_monthly_stats.total_payments + 1,
      total_revenue = partner_monthly_stats.total_revenue + $3,
      royalty_amount = partner_monthly_stats.royalty_amount + $4,
      updated_at = NOW()
  `, [partnerId, yearMonth, amount, royaltyAmount]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: { message: 'Webhook not configured' } });
  }

  let event;

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: { message: `Webhook Error: ${err.message}` } });
  }

  const dbPool = getPool();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);

        // Update payment record
        const updateResult = await dbPool.query(`
          UPDATE payments
          SET status = 'succeeded'
          WHERE stripe_payment_intent_id = $1
          RETURNING partner_id, amount
        `, [paymentIntent.id]);

        // Update partner monthly stats if applicable
        if (updateResult.rows.length > 0) {
          const { partner_id, amount } = updateResult.rows[0];
          if (partner_id) {
            // Get partner royalty rate
            const partnerResult = await dbPool.query(
              'SELECT royalty_rate FROM partners WHERE id = $1',
              [partner_id]
            );
            if (partnerResult.rows.length > 0) {
              const royaltyRate = partnerResult.rows[0].royalty_rate;
              await updatePartnerMonthlyStats(dbPool, partner_id, amount, royaltyRate);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);

        await dbPool.query(`
          UPDATE payments
          SET status = 'failed'
          WHERE stripe_payment_intent_id = $1
        `, [paymentIntent.id]);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.payment_intent);

        // Get the payment record first
        const paymentResult = await dbPool.query(`
          SELECT partner_id, amount FROM payments
          WHERE stripe_payment_intent_id = $1 AND status = 'succeeded'
        `, [charge.payment_intent]);

        if (paymentResult.rows.length > 0) {
          const { partner_id, amount } = paymentResult.rows[0];

          // Update payment status
          await dbPool.query(`
            UPDATE payments
            SET status = 'refunded'
            WHERE stripe_payment_intent_id = $1
          `, [charge.payment_intent]);

          // Reverse partner monthly stats if applicable
          if (partner_id) {
            const partnerResult = await dbPool.query(
              'SELECT royalty_rate FROM partners WHERE id = $1',
              [partner_id]
            );
            if (partnerResult.rows.length > 0) {
              const royaltyRate = partnerResult.rows[0].royalty_rate;
              const yearMonth = new Date().toISOString().slice(0, 7);
              const royaltyAmount = parseFloat(amount) * parseFloat(royaltyRate);

              await dbPool.query(`
                UPDATE partner_monthly_stats
                SET
                  total_payments = GREATEST(0, total_payments - 1),
                  total_revenue = GREATEST(0, total_revenue - $3),
                  royalty_amount = GREATEST(0, royalty_amount - $4),
                  updated_at = NOW()
                WHERE partner_id = $1 AND year_month = $2
              `, [partner_id, yearMonth, amount, royaltyAmount]);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      error: { message: 'Webhook processing failed' }
    });
  }
};
