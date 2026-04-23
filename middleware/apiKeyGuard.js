const crypto = require('crypto');

const ALLOWED_KEYS = new Set(
  (process.env.API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean)
);

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function apiKeyGuard(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({ error: 'Missing x-api-key header' });
  }

  const isValid = [...ALLOWED_KEYS].some((allowed) => {
    try {
      return timingSafeEqual(key, allowed);
    } catch {
      return false;
    }
  });

  if (!isValid) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = apiKeyGuard;