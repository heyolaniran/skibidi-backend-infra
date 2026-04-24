import { useState, useEffect, useRef } from 'react';
import { createInvoice, getPaymentStatus } from '../services/api';

// status: 'loading' | 'waiting' | 'paid' | 'error'
// createInvoiceFn: optional override — defaults to createInvoice(amountSats, description)

export default function PaymentModal({ amountSats, description, createInvoiceFn, onSuccess, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [qr, setQr] = useState(null);
  const [paymentToken, setPaymentToken] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const invoiceFn = createInvoiceFn ?? (() => createInvoice(amountSats, description));
    invoiceFn()
      .then((data) => {
        setInvoice(data.invoice);
        setQr(data.qr);
        setPaymentToken(data.paymentToken);
        setStatus('waiting');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });

    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (status !== 'waiting' || !paymentToken) return;

    pollRef.current = setInterval(async () => {
      try {
        const { status: s } = await getPaymentStatus(paymentToken);
        if (s === 'paid') {
          clearInterval(pollRef.current);
          setStatus('paid');
          setTimeout(onSuccess, 1200);
        }
      } catch {
        // silently retry on network hiccups
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [status, paymentToken]);

  function copyInvoice() {
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="font-bold text-white text-lg">Lightning Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Amount */}
        <div className="text-center mb-5">
          <span className="text-4xl font-bold text-orange-400">
            {amountSats.toLocaleString()}
          </span>
          <span className="text-zinc-400 ml-2 text-lg">sats</span>
          <p className="text-zinc-500 text-sm mt-1 truncate">{description}</p>
        </div>

        {/* Loading spinner */}
        {status === 'loading' && (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <p className="text-red-400 text-sm text-center py-6">{error}</p>
        )}

        {/* Invoice display */}
        {(status === 'waiting' || status === 'paid') && qr && (
          <>
            <div className="flex justify-center mb-4">
              <img
                src={qr}
                alt="Lightning invoice QR"
                className="w-52 h-52 rounded-xl border border-zinc-700"
              />
            </div>

            <div className="bg-zinc-800 rounded-lg p-3 mb-4">
              <p className="text-zinc-400 text-xs font-mono break-all line-clamp-3 leading-relaxed">
                {invoice}
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={copyInvoice}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy Invoice'}
              </button>
              <a
                href={`lightning:${invoice}`}
                className="flex-1 bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-xl text-sm font-medium text-center transition-colors"
              >
                Open Wallet
              </a>
            </div>
          </>
        )}

        {/* Status indicator */}
        {status === 'waiting' && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            Waiting for payment…
          </div>
        )}

        {status === 'paid' && (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <span>✓</span>
            Payment confirmed — unlocking content…
          </div>
        )}
      </div>
    </div>
  );
}
