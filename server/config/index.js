/**
 * Multi-environment configuration and secrets for UniPilot.
 * All secrets from env; no defaults for secrets in production.
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const config = {
  env: NODE_ENV,
  isProd,
  isTest,

  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    publicUrl: (process.env.APP_URL || process.env.VITE_APP_URL || process.env.VITE_BACKEND_URL || '').trim().replace(/\/+$/, ''),
  },

  database: {
    url: process.env.DATABASE_URL || '',
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    poolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS || '30000', 10),
    poolConnectTimeoutMs: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT_MS || '10000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || (isProd ? '' : 'unipilot-dev-secret-change-in-production'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
      : true,
    credentials: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    limit: parseInt(process.env.RATE_LIMIT_GLOBAL || '2400', 10),
    auth: {
      windowMs: 15 * 60 * 1000,
      limit: parseInt(process.env.RATE_LIMIT_AUTH || '50', 10),
    },
    ai: {
      windowMs: 60 * 60 * 1000,
      limit: parseInt(process.env.RATE_LIMIT_AI_PER_HOUR || '100', 10),
    },
  },

  stripe: {
    secretKey: (process.env.STRIPE_SECRET_KEY || '').trim(),
    webhookSecret: (process.env.STRIPE_WEBHOOK_SECRET || '').trim(),
    publishableKey: (process.env.STRIPE_PUBLISHABLE_KEY || '').trim(),
    freePlanPriceId: (process.env.STRIPE_FREE_PLAN_PRICE_ID || '').trim(),
    proPlanPriceId: (process.env.STRIPE_PRO_PLAN_PRICE_ID || '').trim(),
    studentPlanPriceId: (process.env.STRIPE_STUDENT_PLAN_PRICE_ID || '').trim(),
  },

  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    freeTierMonthlyLimit: parseInt(process.env.AI_FREE_MONTHLY_LIMIT || '50', 10),
    proUnlimited: true,
  },

  redis: {
    url: process.env.REDIS_URL || '',
    enabled: !!process.env.REDIS_URL,
  },

  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: NODE_ENV,
  },

  posthog: {
    apiKey: process.env.POSTHOG_API_KEY || '',
    host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
  },
};

// Production guards
if (isProd) {
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be set in production and at least 32 characters.');
  }
  if (!config.database.url || !config.database.url.trim()) {
    throw new Error('DATABASE_URL must be set in production.');
  }
}

export default config;
