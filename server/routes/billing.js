/**
 * Billing and subscription API: checkout, portal, webhook.
 * Stripe: Free / Pro / Student plans.
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import config from '../config/index.js';
import * as subscriptionService from '../services/subscriptionService.js';
import logger from '../lib/logger.js';

export const billingRouter = Router();

let stripe = null;
try {
  if (config.stripe.secretKey) {
    stripe = (await import('stripe')).default(config.stripe.secretKey);
  }
} catch (_) {}

function getBillingConfigStatus() {
  return {
    stripeLoaded: !!stripe,
    hasSecretKey: !!config.stripe.secretKey,
    hasWebhookSecret: !!config.stripe.webhookSecret,
    hasProPriceId: !!config.stripe.proPlanPriceId,
    hasStudentPriceId: !!config.stripe.studentPlanPriceId,
  };
}

function isCheckoutConfigured() {
  const s = getBillingConfigStatus();
  return s.stripeLoaded && s.hasWebhookSecret && (s.hasProPriceId || s.hasStudentPriceId);
}

function isPortalConfigured() {
  const s = getBillingConfigStatus();
  return s.stripeLoaded && s.hasSecretKey;
}

function buildBaseUrl(req) {
  const fromConfig = (config.server.publicUrl || '').trim();
  if (fromConfig) return fromConfig.replace(/\/+$/, '');
  const host = req.get('host');
  if (!host) return '';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${host}`.replace(/\/+$/, '');
}

function getPriceIdFromPlanId(planId) {
  if (planId === 'pro') return config.stripe.proPlanPriceId || null;
  if (planId === 'student') return config.stripe.studentPlanPriceId || null;
  return null;
}

/** If value is product id (prod_xxx), fetch default price from Stripe; otherwise return as-is (price_xxx). */
async function resolvePriceId(stripeClient, value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith('price_')) return v;
  if (!v.startsWith('prod_') || !stripeClient) return null;
  try {
    const product = await stripeClient.products.retrieve(v, { expand: ['default_price'] });
    const defaultPrice = product.default_price;
    if (defaultPrice && typeof defaultPrice === 'object' && defaultPrice.id) return defaultPrice.id;
    if (defaultPrice && typeof defaultPrice === 'string' && defaultPrice.startsWith('price_')) return defaultPrice;
    const list = await stripeClient.prices.list({ product: v, limit: 1 });
    if (list.data?.length) return list.data[0].id;
    return null;
  } catch (_) {
    return null;
  }
}

// GET /api/billing/plans — list plans (public or for pricing page)
billingRouter.get('/plans', (req, res) => {
  const configStatus = getBillingConfigStatus();
  res.json({
    plans: [
      { id: 'free', name: 'Free', ai_monthly_limit: config.ai.freeTierMonthlyLimit ?? 50, price: null },
      { id: 'pro', name: 'Pro', ai_monthly_limit: null, price_id: config.stripe.proPlanPriceId || null },
      { id: 'student', name: 'Student', ai_monthly_limit: null, price_id: config.stripe.studentPlanPriceId || null },
    ],
    publishable_key: config.stripe.publishableKey || null,
    billing_configured: isCheckoutConfigured(),
    billing_portal_configured: isPortalConfigured(),
    config_status: configStatus,
  });
});

// GET /api/billing/me — current subscription and usage (auth)
billingRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const data = await subscriptionService.getSubscriptionAndUsage(req.user.id);
    data.billing_configured = isCheckoutConfigured();
    data.billing_portal_configured = isPortalConfigured();
    data.billing_config_status = getBillingConfigStatus();
    return res.json(data);
  } catch (e) {
    logger.error('Billing me error', { err: e, userId: req.user?.id });
    return res.status(500).json({ detail: 'Failed to load subscription' });
  }
});

// POST /api/billing/checkout — create Stripe Checkout session for upgrade
billingRouter.post('/checkout', authMiddleware, async (req, res) => {
  if (!isCheckoutConfigured()) {
    return res.status(503).json({
      detail: 'Billing not configured. Missing one or more required Stripe settings (secret, webhook, or price IDs).',
      config_status: getBillingConfigStatus(),
    });
  }
  const { price_id: reqPriceId, plan_id, success_url, cancel_url } = req.body || {};
  const normalizedPlan = typeof plan_id === 'string' ? plan_id.toLowerCase().trim() : '';
  const rawPriceId = reqPriceId || getPriceIdFromPlanId(normalizedPlan);
  if (!rawPriceId) {
    return res.status(400).json({ detail: 'price_id or valid plan_id (pro/student) is required' });
  }
  const priceId = rawPriceId.trim().startsWith('price_')
    ? rawPriceId.trim()
    : await resolvePriceId(stripe, rawPriceId.trim());
  if (!priceId) {
    return res.status(400).json({
      detail: 'Invalid price_id or plan not configured. Use a Stripe Price ID (price_...) or a Product ID (prod_...) with a default price.',
    });
  }
  const allowedPro = await resolvePriceId(stripe, config.stripe.proPlanPriceId);
  const allowedStudent = await resolvePriceId(stripe, config.stripe.studentPlanPriceId);
  const allowedPriceIds = [allowedPro, allowedStudent].filter(Boolean);
  if (!allowedPriceIds.includes(priceId)) {
    return res.status(400).json({ detail: 'Invalid price_id for this server configuration' });
  }
  try {
    const baseUrl = buildBaseUrl(req);
    const successUrl = success_url || `${baseUrl}/settings?subscription=success`;
    const cancelUrl = cancel_url || `${baseUrl}/pricing?subscription=cancelled`;
    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ detail: 'Could not resolve success/cancel URL. Set APP_URL or send success_url/cancel_url.' });
    }
    const customerId = await subscriptionService.getOrCreateStripeCustomerId(req.user.id, stripe);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { user_id: String(req.user.id) },
      subscription_data: {
        metadata: { user_id: String(req.user.id) },
      },
    });
    return res.json({ url: session.url, session_id: session.id });
  } catch (e) {
    logger.error('Checkout error', { err: e, userId: req.user?.id });
    return res.status(500).json({ detail: e.message || 'Checkout failed' });
  }
});

// POST /api/billing/portal — create Stripe Customer Portal session (manage/cancel)
billingRouter.post('/portal', authMiddleware, async (req, res) => {
  if (!isPortalConfigured()) {
    return res.status(503).json({ detail: 'Billing not configured. Missing STRIPE_SECRET_KEY.' });
  }
  const { return_url } = req.body || {};
  try {
    const baseUrl = buildBaseUrl(req);
    const defaultReturnUrl = `${baseUrl}/settings`;
    const resolvedReturnUrl = return_url || req.headers.referer || defaultReturnUrl;
    if (!resolvedReturnUrl) {
      return res.status(400).json({ detail: 'Could not resolve return_url. Set APP_URL or send return_url.' });
    }
    const customerId = await subscriptionService.getOrCreateStripeCustomerId(req.user.id, stripe);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: resolvedReturnUrl,
    });
    return res.json({ url: session.url });
  } catch (e) {
    logger.error('Portal error', { err: e, userId: req.user?.id });
    return res.status(500).json({ detail: e.message || 'Portal failed' });
  }
});

// Webhook handler: must be mounted with express.raw({ type: 'application/json' }) before express.json()
export function handleStripeWebhook(req, res) {
  if (!stripe || !config.stripe.webhookSecret) {
    return res.status(503).send();
  }
  const sig = req.headers['stripe-signature'];
  const rawBody = req.body; // Buffer when using express.raw()
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, config.stripe.webhookSecret);
  } catch (e) {
    logger.warn('Stripe webhook signature invalid', { message: e.message });
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  (async () => {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id || (await lookupUserIdByCustomerId(sub.customer));
        if (userId) await subscriptionService.upsertSubscription(userId, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.user_id || (await lookupUserIdByCustomerId(sub.customer));
        if (userId) await subscriptionService.removeSubscription(userId);
        break;
      }
      case 'invoice.payment_failed':
        logger.warn('Stripe invoice payment failed', { invoice: event.data.object?.id });
        break;
      default:
        break;
    }
  })().catch((e) => logger.error('Stripe webhook handler error', { err: e, type: event.type }));
  res.json({ received: true });
}

// POST /api/billing/webhook — use handleStripeWebhook with express.raw() in index.js
billingRouter.post('/webhook', (req, res) => {
  res.status(404).json({ detail: 'Use dedicated webhook URL with raw body' });
});

async function lookupUserIdByCustomerId(customerId) {
  const { db } = await import('../db.js');
  const row = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
  return row?.id ?? null;
}
