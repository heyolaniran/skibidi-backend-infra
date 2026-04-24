const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const paymentStore = require('./paymentStore');

// Set USE_IPTABLES=true in .env to apply real firewall rules.
// Without it the service only tracks sessions in memory (useful for dev/testing).
const USE_IPTABLES = process.env.USE_IPTABLES === 'true';

// Strip IPv4-mapped IPv6 prefix (::ffff:192.168.x.x → 192.168.x.x)
function normalizeIP(raw) {
  if (!raw) return null;
  return raw.replace(/^::ffff:/, '');
}

// Only allow well-formed IPv4/IPv6 to reach iptables — no shell injection possible
// because we use execFile (no shell), but defense-in-depth is good.
function isValidIP(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip);
}

class WiFiAccessService {
  constructor() {
    this.sessions = new Map(); // ip → { expiresAt, timer, durationMinutes }

    // React to any confirmed payment that carries WiFi metadata
    paymentStore.on('paid', (_token, entry) => {
      if (entry.metadata?.type === 'wifi') {
        const { ip, durationMinutes } = entry.metadata;
        this.grantAccess(ip, durationMinutes).catch((err) =>
          console.error(`[WiFi] Failed to grant access to ${ip}:`, err.message)
        );
      }
    });
  }

  async grantAccess(ip, durationMinutes) {
    const normalized = normalizeIP(ip);

    // Extend an existing session instead of resetting it
    if (this.sessions.has(normalized)) {
      const existing = this.sessions.get(normalized);
      clearTimeout(existing.timer);
      const addedMs = durationMinutes * 60 * 1000;
      const newExpiry = Math.max(existing.expiresAt, Date.now()) + addedMs;
      const remaining = newExpiry - Date.now();
      existing.expiresAt = newExpiry;
      existing.timer = setTimeout(() => this.revokeAccess(normalized), remaining);
      console.log(`[WiFi] Extended session for ${normalized} (+${durationMinutes} min)`);
      return;
    }

    if (USE_IPTABLES && isValidIP(normalized)) {
      await execFileAsync('iptables', ['-I', 'FORWARD', '-s', normalized, '-j', 'ACCEPT']);
      await execFileAsync('iptables', ['-I', 'FORWARD', '-d', normalized, '-j', 'ACCEPT']);
    }

    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    const timer = setTimeout(() => this.revokeAccess(normalized), durationMinutes * 60 * 1000);
    this.sessions.set(normalized, { expiresAt, timer, durationMinutes });
    console.log(`[WiFi] Access granted to ${normalized} for ${durationMinutes} min`);
  }

  async revokeAccess(ip) {
    const normalized = normalizeIP(ip);
    if (USE_IPTABLES && isValidIP(normalized)) {
      await execFileAsync('iptables', ['-D', 'FORWARD', '-s', normalized, '-j', 'ACCEPT']).catch(() => {});
      await execFileAsync('iptables', ['-D', 'FORWARD', '-d', normalized, '-j', 'ACCEPT']).catch(() => {});
    }
    const sess = this.sessions.get(normalized);
    if (sess) clearTimeout(sess.timer);
    this.sessions.delete(normalized);
    console.log(`[WiFi] Access revoked for ${normalized}`);
  }

  getSession(ip) {
    const normalized = normalizeIP(ip);
    const session = this.sessions.get(normalized);
    if (!session) return null;
    if (Date.now() >= session.expiresAt) {
      this.revokeAccess(normalized);
      return null;
    }
    return session;
  }
}

module.exports = new WiFiAccessService();
