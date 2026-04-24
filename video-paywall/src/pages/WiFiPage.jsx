import { useState, useEffect, useRef } from 'react';
import { getWifiStatus, createWifiInvoice } from '../services/api';
import PaymentModal from '../components/PaymentModal';

const PACKAGES = [
  { id: '15min',   label: '15 Minutes', minutes: 15,   priceSats: 100,  icon: '⚡', description: 'Quick browse' },
  { id: '1hour',   label: '1 Hour',     minutes: 60,   priceSats: 350,  icon: '⚡⚡', description: 'Light session' },
  { id: '3hours',  label: '3 Hours',    minutes: 180,  priceSats: 800,  icon: '⚡⚡⚡', description: 'Work session' },
  { id: '24hours', label: '24 Hours',   minutes: 1440, priceSats: 2000, icon: '🔥', description: 'Full day' },
];

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function WiFiPage() {
  const [status, setStatus] = useState(null); // null while loading
  const [countdown, setCountdown] = useState(0);
  const [paying, setPaying] = useState(null); // null | package object
  const countdownRef = useRef(null);

  useEffect(() => {
    checkStatus();
    return () => clearInterval(countdownRef.current);
  }, []);

  async function checkStatus() {
    try {
      const data = await getWifiStatus();
      setStatus(data);
      if (data.hasAccess) startCountdown(data.remainingSeconds);
    } catch {
      setStatus({ hasAccess: false });
    }
  }

  function startCountdown(seconds) {
    clearInterval(countdownRef.current);
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current);
          setStatus({ hasAccess: false });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function handlePaymentSuccess() {
    setPaying(null);
    // Give backend ~1s to register access then re-check
    setTimeout(checkStatus, 1200);
  }

  const progressPct = paying
    ? (countdown / (paying.minutes * 60)) * 100
    : status?.hasAccess
    ? (countdown / (countdown + 1)) * 100 // approx — we don't know total
    : 0;

  if (!status) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-16">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mx-auto mb-5 text-4xl">
            📶
          </div>
          <h1 className="text-3xl font-bold mb-2">WiFi Access</h1>
          <p className="text-zinc-400">
            Pay instantly with Bitcoin Lightning — no account needed.
          </p>
          {status.ip && (
            <p className="text-zinc-600 text-xs mt-2 font-mono">Device: {status.ip}</p>
          )}
        </div>

        {/* ── Active session banner ── */}
        {status.hasAccess && (
          <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-6 text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </div>
            <div className="text-5xl font-mono font-bold text-white tabular-nums mb-1">
              {formatCountdown(countdown)}
            </div>
            <div className="text-zinc-500 text-sm">remaining</div>

            {/* Progress bar draining left→right */}
            <div className="mt-4 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (countdown / 86400) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Packages ── */}
        <div>
          <h2 className="text-base font-semibold text-zinc-300 mb-4">
            {status.hasAccess ? 'Extend your session' : 'Choose a package'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setPaying(pkg)}
                className="group bg-zinc-900 border border-zinc-800 hover:border-orange-500/60 rounded-xl p-5 text-left transition-all"
              >
                <div className="text-2xl mb-3">{pkg.icon}</div>
                <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {pkg.label}
                </div>
                <div className="text-orange-400 font-bold text-sm mt-0.5">
                  {pkg.priceSats.toLocaleString()} sats
                </div>
                <div className="text-zinc-600 text-xs mt-1">{pkg.description}</div>
              </button>
            ))}
          </div>

          <p className="text-zinc-600 text-xs text-center mt-6">
            Sessions stack — buying more time extends your current session.
          </p>
        </div>
      </div>

      {/* ── Payment modal ── */}
      {paying && (
        <PaymentModal
          amountSats={paying.priceSats}
          description={`WiFi: ${paying.label}`}
          createInvoiceFn={() => createWifiInvoice(paying.id)}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaying(null)}
        />
      )}
    </div>
  );
}
