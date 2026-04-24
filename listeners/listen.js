const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;
const paymentStore = require('../services/paymentStore');

// Custom format for the console to mimic NestJS
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(info => {
    const context = 'JsEventListener'; // Context for this logger instance
    return `[Breez API] ${process.pid} - ${info.timestamp}   ${info.level} [${context}] ${info.message}`;
  })
);

// JSON format for the file
const fileFormat = combine(
  timestamp(),
  json()
);

const logger = createLogger({
  level: 'info',
  transports: [
    new transports.Console({
      format: consoleFormat
    }),
    new transports.File({
      filename: 'events.log',
      format: fileFormat
    })
  ],
});

class JsEventListener {
  onEvent(event) {
    logger.info(`Event received: ${JSON.stringify(event, null, 2)}`);

    try {
      if (event.type !== 'paymentSucceeded') return;

      // event.details IS the payment object (not event.details.payment)
      const details = event.details;
      if (!details || details.paymentType !== 'receive') return;

      // destination holds the original BOLT11 invoice string
      const destination = details.destination || details.details?.invoice;
      if (destination) {
        const token = paymentStore.findByInvoice(destination);
        if (token) {
          paymentStore.markPaid(token);
          logger.info(`Payment confirmed for token: ${token}`);
        }
      }
    } catch (err) {
      logger.error(`Error processing payment event: ${err.message}`);
    }
  }
}

module.exports = JsEventListener;