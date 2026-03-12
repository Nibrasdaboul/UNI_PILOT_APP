-- UniPilot SaaS: subscriptions, usage, ai_requests, analytics_events, users extensions
-- Run after schema-pg.sql. Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS via app logic).

-- Plans reference (logical; no FK if Stripe-driven)
-- Free: limited AI usage. Pro: unlimited. Student: discounted Pro.

-- Subscriptions: one active per user (Stripe-driven)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stripe_price_id TEXT,
  ai_monthly_limit INTEGER,
  features_json TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed plans (ignore if already present)
INSERT INTO plans (id, name, stripe_price_id, ai_monthly_limit, features_json) VALUES
  ('free', 'Free', NULL, 50, '{"ai_summary":true,"flashcards":true,"quiz":true,"limits":true}'),
  ('pro', 'Pro', NULL, NULL, '{"ai_summary":true,"flashcards":true,"quiz":true,"unlimited_ai":true}'),
  ('student', 'Student', NULL, NULL, '{"ai_summary":true,"flashcards":true,"quiz":true,"unlimited_ai":true,"discount":true}')
ON CONFLICT (id) DO NOTHING;

-- Extend users for billing and verification (run via migration runner; duplicate column errors ignored)
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES plans(id);
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN student_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan_id);

-- Subscriptions: Stripe subscription state per user
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Usage tracking: AI and feature usage per user per period (for limits and billing)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  ai_requests_count INTEGER NOT NULL DEFAULT 0,
  ai_tokens_approx INTEGER NOT NULL DEFAULT 0,
  summaries_count INTEGER NOT NULL DEFAULT 0,
  flashcards_count INTEGER NOT NULL DEFAULT 0,
  quizzes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start);

-- AI requests log: for metering, abuse detection, and cost visibility
CREATE TABLE IF NOT EXISTS ai_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  model TEXT,
  tokens_approx INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_user_created ON ai_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created ON ai_requests(created_at DESC);

-- Analytics events: product analytics (signup, feature usage, conversion)
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  event_name TEXT NOT NULL,
  properties_json TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON analytics_events(event_name, created_at DESC);
