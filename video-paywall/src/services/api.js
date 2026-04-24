const API_BASE = '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const baseHeaders = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'x-api-key': API_KEY }),
};

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...baseHeaders, ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// amountSats: amount in satoshis (the backend field is named amountMsat but acts as sats)
export function createInvoice(amountSats, description) {
  return request('/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ amountMsat: amountSats, description }),
  });
}

export function getPaymentStatus(paymentToken) {
  return request(`/payment-status/${paymentToken}`);
}

// ── WiFi ──────────────────────────────────────────────────────────────────────

export function getWifiPackages() {
  return request('/wifi/packages');
}

export function getWifiStatus() {
  return request('/wifi/status');
}

export function createWifiInvoice(packageId) {
  return request('/wifi/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ packageId }),
  });
}
