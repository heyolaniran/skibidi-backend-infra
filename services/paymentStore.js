const EventEmitter = require('events');

class PaymentStore extends EventEmitter {
  constructor() {
    super();
    this.payments = new Map();
  }

  // metadata: optional object attached to the payment (e.g. { type: 'wifi', ip, durationMinutes })
  add(token, invoice, metadata = {}) {
    this.payments.set(token, { invoice, status: 'pending', metadata, createdAt: Date.now() });
  }

  get(token) {
    return this.payments.get(token) || null;
  }

  markPaid(token) {
    const entry = this.payments.get(token);
    if (entry && entry.status === 'pending') {
      entry.status = 'paid';
      this.emit('paid', token, entry);
    }
  }

  findByInvoice(invoiceStr) {
    for (const [token, data] of this.payments) {
      if (data.invoice === invoiceStr) return token;
    }
    return null;
  }
}

module.exports = new PaymentStore();
