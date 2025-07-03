const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;

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
        // Stringify the event object to be included in the message
        logger.info(`Event received: ${JSON.stringify(event, null, 2)}`);
    }
}

module.exports = JsEventListener;