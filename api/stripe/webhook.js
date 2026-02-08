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

/**
 * Check if salesperson contract is still active
 */
function isSalespersonContractActive(contractStart, contractMonths) {
  if (!contractStart || !contractMonths) return false;

  const startDate = new Date(contractStart);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + parseInt(contractMonths, 10));

  return new Date() < endDate;
}

/**
 * Update monthly stats for salesperson
 */
async function updateSalespersonMonthlyStats(dbPool, salespersonId, amount, royaltyRate) {
  const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const royaltyAmount = parseFloat(amount) * parseFloat(royaltyRate);

  await dbPool.query(`
    INSERT INTO salesperson_monthly_stats (salesperson_id, year_month, total_payments, total_revenue, royalty_amount)
    VALUES ($1, $2, 1, $3, $4)
    ON CONFLICT (salesperson_id, year_month)
    DO UPDATE SET
      total_payments = salesperson_monthly_stats.total_payments + 1,
      total_revenue = salesperson_monthly_stats.total_revenue + $3,
      royalty_amount = salesperson_monthly_stats.royalty_amount + $4,
      updated_at = NOW()
  `, [salespersonId, yearMonth, amount, royaltyAmount]);
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

        const metadata = paymentIntent.metadata || {};
        const amount = paymentIntent.amount / 100; // Convert cents to dollars
        const partnerId = metadata.partner_id ? parseInt(metadata.partner_id, 10) : null;

        // Use INSERT ... ON CONFLICT for idempotency (prevents duplicate records)
        const upsertResult = await dbPool.query(`
          INSERT INTO payments (
            session_id, stripe_payment_intent_id, amount, currency, status,
            partner_code, partner_id, customer_email, kanji_name
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (stripe_payment_intent_id)
          DO UPDATE SET
            status = 'succeeded',
            updated_at = NOW()
          WHERE payments.status != 'succeeded'
          RETURNING id, (xmax = 0) as inserted
        `, [
          metadata.session_id || null,
          paymentIntent.id,
          amount,
          paymentIntent.currency || 'usd',
          'succeeded',
          metadata.partner_code || null,
          partnerId,
          paymentIntent.receipt_email || null,
          metadata.kanji_name || null
        ]);

        // Only update partner stats if this is a new insert (not a duplicate webhook)
        const wasInserted = upsertResult.rows[0]?.inserted;
        if (wasInserted && partnerId) {
          const partnerResult = await dbPool.query(`
            SELECT
              p.royalty_rate,
              p.salesperson_id,
              p.salesperson_contract_start,
              p.salesperson_contract_months,
              s.royalty_rate as salesperson_royalty_rate
            FROM partners p
            LEFT JOIN salespersons s ON p.salesperson_id = s.id AND s.status = 'active'
            WHERE p.id = $1
          `, [partnerId]);

          if (partnerResult.rows.length > 0) {
            const partner = partnerResult.rows[0];
            const partnerRoyaltyRate = parseFloat(partner.royalty_rate) || 0.10;
            await updatePartnerMonthlyStats(dbPool, partnerId, amount, partnerRoyaltyRate);

            // Update salesperson stats if contract is active
            if (partner.salesperson_id && isSalespersonContractActive(
              partner.salesperson_contract_start,
              partner.salesperson_contract_months
            )) {
              const salespersonRoyaltyRate = parseFloat(partner.salesperson_royalty_rate) || 0.10;
              await updateSalespersonMonthlyStats(dbPool, partner.salesperson_id, amount, salespersonRoyaltyRate);
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

        // Always update payment status to refunded first
        const updateResult = await dbPool.query(`
          UPDATE payments
          SET status = 'refunded', updated_at = NOW()
          WHERE stripe_payment_intent_id = $1 AND status = 'succeeded'
          RETURNING partner_id, amount
        `, [charge.payment_intent]);

        // Reverse partner and salesperson monthly stats if applicable
        if (updateResult.rows.length > 0) {
          const { partner_id, amount } = updateResult.rows[0];
          const yearMonth = new Date().toISOString().slice(0, 7);

          if (partner_id) {
            const partnerResult = await dbPool.query(`
              SELECT
                p.royalty_rate,
                p.salesperson_id,
                p.salesperson_contract_start,
                p.salesperson_contract_months,
                s.royalty_rate as salesperson_royalty_rate
              FROM partners p
              LEFT JOIN salespersons s ON p.salesperson_id = s.id
              WHERE p.id = $1
            `, [partner_id]);

            if (partnerResult.rows.length > 0) {
              const partner = partnerResult.rows[0];
              const partnerRoyaltyRate = parseFloat(partner.royalty_rate) || 0.10;
              const partnerRoyaltyAmount = parseFloat(amount) * partnerRoyaltyRate;

              // Reverse partner stats
              await dbPool.query(`
                UPDATE partner_monthly_stats
                SET
                  total_payments = GREATEST(0, total_payments - 1),
                  total_revenue = GREATEST(0, total_revenue - $3),
                  royalty_amount = GREATEST(0, royalty_amount - $4),
                  updated_at = NOW()
                WHERE partner_id = $1 AND year_month = $2
              `, [partner_id, yearMonth, amount, partnerRoyaltyAmount]);

              // Reverse salesperson stats if applicable
              if (partner.salesperson_id && isSalespersonContractActive(
                partner.salesperson_contract_start,
                partner.salesperson_contract_months
              )) {
                const salespersonRoyaltyRate = parseFloat(partner.salesperson_royalty_rate) || 0.10;
                const salespersonRoyaltyAmount = parseFloat(amount) * salespersonRoyaltyRate;

                await dbPool.query(`
                  UPDATE salesperson_monthly_stats
                  SET
                    total_payments = GREATEST(0, total_payments - 1),
                    total_revenue = GREATEST(0, total_revenue - $3),
                    royalty_amount = GREATEST(0, royalty_amount - $4),
                    updated_at = NOW()
                  WHERE salesperson_id = $1 AND year_month = $2
                `, [partner.salesperson_id, yearMonth, amount, salespersonRoyaltyAmount]);
              }
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
