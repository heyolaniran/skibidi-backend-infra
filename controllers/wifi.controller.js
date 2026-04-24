const { randomUUID } = require('crypto');
const breezService = require('../services/breez.service');
const paymentStore = require('../services/paymentStore');
const wifiAccess = require('../services/wifiAccess');

const PACKAGES = [
  { id: '15min',  label: '15 Minutes', minutes: 15,   priceSats: 100,  description: 'Quick browse' },
  { id: '1hour',  label: '1 Hour',     minutes: 60,   priceSats: 350,  description: 'Light session' },
  { id: '3hours', label: '3 Hours',    minutes: 180,  priceSats: 800,  description: 'Work session' },
  { id: '24hours',label: '24 Hours',   minutes: 1440, priceSats: 2000, description: 'Full day' },
];

const getPackages = (_req, res) => {
  res.json({ packages: PACKAGES });
};

const getWifiStatus = (req, res) => {
  const ip = req.ip || req.socket.remoteAddress;
  const session = wifiAccess.getSession(ip);

  if (!session) {
    return res.json({ hasAccess: false, ip });
  }

  const remainingMs = session.expiresAt - Date.now();
  return res.json({
    hasAccess: true,
    ip,
    remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
    expiresAt: session.expiresAt,
  });
};

const createWifiInvoice = async (req, res) => {
  const { packageId } = req.body;
  if (!packageId) return res.status(400).json({ error: 'packageId is required' });

  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return res.status(400).json({ error: 'Invalid packageId' });

  const ip = req.ip || req.socket.remoteAddress;

  try {
    const paymentToken = randomUUID();
    const invoiceData = await breezService.createInvoice(pkg.priceSats, `WiFi: ${pkg.label}`);
    paymentStore.add(paymentToken, invoiceData.invoice, {
      type: 'wifi',
      ip,
      durationMinutes: pkg.minutes,
    });
    return res.status(201).json({ ...invoiceData, paymentToken });
  } catch (err) {
    console.error('[WiFi] Error creating invoice:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getPackages, getWifiStatus, createWifiInvoice };
