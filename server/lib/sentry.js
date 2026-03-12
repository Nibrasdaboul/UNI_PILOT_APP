/**
 * Sentry error tracking for Node backend.
 * Set SENTRY_DSN to enable. captureException() is called from the global error handler.
 */
const SENTRY_DSN = process.env.SENTRY_DSN?.trim();

let captureFn = null;
if (SENTRY_DSN) {
  try {
    const Sentry = (await import('@sentry/node')).default;
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
    captureFn = (err, context) => {
      if (context) Sentry.setContext('unipilot', context);
      Sentry.captureException(err);
    };
  } catch (e) {
    console.warn('Sentry init failed:', e?.message);
  }
}

export function captureException(err, context = {}) {
  if (captureFn) captureFn(err, context);
}

export function isActive() {
  return !!captureFn;
}
