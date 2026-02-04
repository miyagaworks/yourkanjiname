/**
 * Shared Security Utilities
 * Common CORS, token verification, and validation functions
 */

const crypto = require('crypto');

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://app.kanjiname.jp',
  'https://kanjiname.jp',
  'https://www.kanjiname.jp',
  'https://yourkanjiname.vercel.app',
  // Development origins
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000'
];

/**
 * Set CORS headers with origin whitelist
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests without origin (same-origin, curl, etc.)
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  // If origin is not in whitelist, don't set the header (browser will block)

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Handle CORS preflight request
 * Returns true if this was a preflight request (and response was sent)
 */
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Verify admin token using HMAC-SHA256
 * Token format: {randomValue}.{hmacHash}
 */
function verifyAdminToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const [tokenValue, tokenHash] = token.split('.');

  if (!tokenValue || !tokenHash) {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not configured');
    return false;
  }

  // Use HMAC-SHA256 for secure token verification
  const expectedHash = crypto.createHmac('sha256', adminPassword)
    .update(tokenValue)
    .digest('hex')
    .substring(0, 16);

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(tokenHash),
      Buffer.from(expectedHash)
    );
  } catch {
    return false;
  }
}

/**
 * Verify partner token
 * Token format: {partnerId}.{randomValue}.{hmacHashPrefix}
 */
function verifyPartnerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [partnerId, tokenValue, tokenHashPart] = parts;

  // Use HMAC for verification
  const expectedHash = crypto.createHmac('sha256', tokenValue)
    .update(partnerId)
    .digest('hex');

  // Verify hash prefix matches
  if (!expectedHash.startsWith(tokenHashPart)) {
    return null;
  }

  return parseInt(partnerId, 10);
}

/**
 * Generate admin token
 */
function generateAdminToken() {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const tokenValue = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHmac('sha256', adminPassword)
    .update(tokenValue)
    .digest('hex')
    .substring(0, 16);

  return `${tokenValue}.${tokenHash}`;
}

/**
 * Validate UUID format
 */
function isValidUUID(str) {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email) return false;
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize log data - remove sensitive fields
 */
function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'password_hash', 'token', 'email', 'customer_email'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  ALLOWED_ORIGINS,
  setCorsHeaders,
  handlePreflight,
  verifyAdminToken,
  verifyPartnerToken,
  generateAdminToken,
  isValidUUID,
  isValidEmail,
  sanitizeForLog
};
