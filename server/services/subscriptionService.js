/**
 * Subscription and usage logic for UniPilot SaaS.
 * Plan: free (limited AI), pro (unlimited), student (discounted).
 */
import { db } from '../db.js';
import config from '../config/index.js';

const FREE_PLAN_ID = 'free';
const PRO_PLAN_ID = 'pro';
const STUDENT_PLAN_ID = 'student';

export function getPlanLimits(planId) {
  const plan = (planId || FREE_PLAN_ID).toLowerCase();
  if (plan === PRO_PLAN_ID || plan === STUDENT_PLAN_ID) return { aiMonthlyLimit: null };
  return { aiMonthlyLimit: config.ai.freeTierMonthlyLimit ?? 50 };
}

/**
 * Get current period start/end for usage (calendar month).
 */
function getCurrentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

/**
 * Increment AI usage for user in current period. Returns new count.
 */
export async function incrementAiUsage(userId, feature = 'ai', tokensApprox = 0) {
  const { periodStart, periodEnd } = getCurrentPeriod();
  const uid = Number(userId);
  let row = await db.prepare(
    'SELECT id, ai_requests_count, ai_tokens_approx FROM usage_tracking WHERE user_id = ? AND period_start = ?'
  ).get(uid, periodStart);
  if (!row) {
    await db.prepare(
      'INSERT INTO usage_tracking (user_id, period_start, period_end, ai_requests_count, ai_tokens_approx, summaries_count, flashcards_count, quizzes_count) VALUES (?, ?, ?, 0, 0, 0, 0, 0)'
    ).run(uid, periodStart, periodEnd);
    row = await db.prepare(
      'SELECT id, ai_requests_count, ai_tokens_approx FROM usage_tracking WHERE user_id = ? AND period_start = ?'
    ).get(uid, periodStart);
  }
  const newCount = (row.ai_requests_count || 0) + 1;
  const newTokens = (row.ai_tokens_approx || 0) + (tokensApprox || 0);
  await db.prepare(
    'UPDATE usage_tracking SET ai_requests_count = ?, ai_tokens_approx = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND period_start = ?'
  ).run(newCount, newTokens, uid, periodStart);
  return { count: newCount, tokens: newTokens };
}

/**
 * Check if user can make an AI request (under plan limit).
 */
export async function canUseAi(userId) {
  const user = await db.prepare('SELECT plan_id FROM users WHERE id = ?').get(Number(userId));
  const planId = user?.plan_id || FREE_PLAN_ID;
  const { aiMonthlyLimit } = getPlanLimits(planId);
  if (aiMonthlyLimit == null) return { allowed: true, remaining: null };
  const { periodStart } = getCurrentPeriod();
  const row = await db.prepare(
    'SELECT ai_requests_count FROM usage_tracking WHERE user_id = ? AND period_start = ?'
  ).get(Number(userId), periodStart);
  const used = row?.ai_requests_count ?? 0;
  const remaining = Math.max(0, aiMonthlyLimit - used);
  return { allowed: remaining > 0, remaining };
}

/**
 * Log an AI request for metering and analytics.
 */
export async function logAiRequest(userId, feature, model, tokensApprox) {
  const uid = Number(userId);
  await db.prepare(
    'INSERT INTO ai_requests (user_id, feature, model, tokens_approx) VALUES (?, ?, ?, ?)'
  ).run(uid, feature || 'unknown', model || null, tokensApprox || 0);
}

/**
 * Get or create Stripe customer for user.
 */
export async function getOrCreateStripeCustomerId(userId, stripe) {
  if (!stripe) return null;
  const user = await db.prepare('SELECT id, email, stripe_customer_id FROM users WHERE id = ?').get(Number(userId));
  if (!user) return null;
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { unipilot_user_id: String(userId) },
  });
  await db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customer.id, userId);
  return customer.id;
}

/**
 * Update subscription from Stripe webhook (customer.subscription.updated/deleted).
 */
export async function upsertSubscription(userId, stripeSubscription) {
  const uid = Number(userId);
  const subId = stripeSubscription.id;
  const status = stripeSubscription.status;
  const priceObj = stripeSubscription.items?.data?.[0]?.price;
  const priceId = priceObj?.id || null;
  const productId =
    typeof priceObj?.product === 'string'
      ? priceObj.product
      : priceObj?.product?.id || null;
  let planId = FREE_PLAN_ID;
  const proCfg = (config.stripe.proPlanPriceId || '').trim();
  const studentCfg = (config.stripe.studentPlanPriceId || '').trim();
  if (proCfg) {
    if (proCfg.startsWith('price_') && priceId === proCfg) {
      planId = PRO_PLAN_ID;
    } else if (proCfg.startsWith('prod_') && productId === proCfg) {
      planId = PRO_PLAN_ID;
    }
  }
  if (planId === FREE_PLAN_ID && studentCfg) {
    if (studentCfg.startsWith('price_') && priceId === studentCfg) {
      planId = STUDENT_PLAN_ID;
    } else if (studentCfg.startsWith('prod_') && productId === studentCfg) {
      planId = STUDENT_PLAN_ID;
    }
  }
  const periodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : null;
  const cancelAtPeriodEnd = !!stripeSubscription.cancel_at_period_end;
  const existing = await db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(uid);
  if (existing) {
    await db.prepare(`
      UPDATE subscriptions SET
        stripe_subscription_id = ?, stripe_price_id = ?, plan_id = ?, status = ?,
        current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(subId, priceId, planId, status, periodStart, periodEnd, cancelAtPeriodEnd, uid);
  } else {
    await db.prepare(`
      INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uid, subId, priceId, planId, status, periodStart, periodEnd, cancelAtPeriodEnd);
  }
  if (status === 'active' || status === 'trialing') {
    await db.prepare('UPDATE users SET plan_id = ? WHERE id = ?').run(planId, uid);
  } else {
    await db.prepare('UPDATE users SET plan_id = ? WHERE id = ?').run(FREE_PLAN_ID, uid);
  }
}

/**
 * Remove subscription and set user back to free.
 */
export async function removeSubscription(userId) {
  const uid = Number(userId);
  await db.prepare('UPDATE subscriptions SET status = ? WHERE user_id = ?').run('canceled', uid);
  await db.prepare('UPDATE users SET plan_id = ? WHERE id = ?').run(FREE_PLAN_ID, uid);
}

/**
 * Get subscription and usage for current user (for dashboard/billing UI).
 */
export async function getSubscriptionAndUsage(userId) {
  const uid = Number(userId);
  const user = await db.prepare('SELECT plan_id FROM users WHERE id = ?').get(uid);
  const planId = user?.plan_id || FREE_PLAN_ID;
  const sub = await db.prepare(
    'SELECT stripe_subscription_id, status, current_period_end, cancel_at_period_end FROM subscriptions WHERE user_id = ?'
  ).get(uid);
  const { periodStart } = getCurrentPeriod();
  const usage = await db.prepare(
    'SELECT ai_requests_count, ai_tokens_approx FROM usage_tracking WHERE user_id = ? AND period_start = ?'
  ).get(uid, periodStart);
  const limits = getPlanLimits(planId);
  return {
    plan_id: planId,
    ai_monthly_limit: limits.aiMonthlyLimit,
    ai_used: usage?.ai_requests_count ?? 0,
    ai_remaining: limits.aiMonthlyLimit != null ? Math.max(0, limits.aiMonthlyLimit - (usage?.ai_requests_count ?? 0)) : null,
    subscription: sub ? {
      status: sub.status,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    } : null,
  };
}
