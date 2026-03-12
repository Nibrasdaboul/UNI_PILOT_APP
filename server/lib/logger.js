/**
 * Structured logging for UniPilot.
 * JSON in production for log aggregation; readable in development.
 */
import config from '../config/index.js';

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const level = (process.env.LOG_LEVEL || (config.isProd ? 'info' : 'debug')).toLowerCase();
const currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;

function serialize(err) {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      stack: config.isProd ? undefined : err.stack,
      code: err.code,
    };
  }
  return err;
}

function format(severity, message, meta = {}) {
  const base = {
    timestamp: new Date().toISOString(),
    level: severity,
    message,
    ...(Object.keys(meta).length ? { ...meta } : {}),
  };
  if (config.isProd) {
    return JSON.stringify(base);
  }
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${base.timestamp}] ${severity.toUpperCase()}: ${message}${metaStr}`;
}

function log(severity, message, meta = {}) {
  if ((LOG_LEVELS[severity] ?? 0) > currentLevel) return;
  const out = format(severity, message, meta);
  if (severity === 'error') {
    console.error(out);
  } else if (severity === 'warn') {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export const logger = {
  error(message, meta = {}) {
    if (meta.err) meta.err = serialize(meta.err);
    log('error', message, meta);
  },
  warn(message, meta = {}) {
    log('warn', message, meta);
  },
  info(message, meta = {}) {
    log('info', message, meta);
  },
  debug(message, meta = {}) {
    log('debug', message, meta);
  },
  child(bindings = {}) {
    return {
      error(m, meta = {}) { logger.error(m, { ...bindings, ...meta }); },
      warn(m, meta = {}) { logger.warn(m, { ...bindings, ...meta }); },
      info(m, meta = {}) { logger.info(m, { ...bindings, ...meta }); },
      debug(m, meta = {}) { logger.debug(m, { ...bindings, ...meta }); },
    };
  },
};

export default logger;
