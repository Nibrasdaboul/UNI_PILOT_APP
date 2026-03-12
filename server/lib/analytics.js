/**
 * Product analytics: persist events to DB and optionally send to PostHog/Mixpanel.
 * Events: signup, feature_used, ai_used, conversion_to_paid, etc.
 */
import { db } from '../db.js';
import config from '../config/index.js';
import logger from './logger.js';

export async function track(eventName, props = {}, userId = null, anonymousId = null) {
  const properties = typeof props === 'object' && props !== null ? props : {};
  try {
    await db.prepare(
      'INSERT INTO analytics_events (user_id, anonymous_id, event_name, properties_json) VALUES (?, ?, ?, ?)'
    ).run(
      userId || null,
      anonymousId || null,
      String(eventName).slice(0, 200),
      JSON.stringify(properties).slice(0, 5000)
    );
  } catch (e) {
    if (e.code !== '42P01') logger.warn('Analytics track failed (table may not exist)', { err: e.message });
  }
  if (config.posthog?.apiKey) {
    try {
      await fetch(`${config.posthog.host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: config.posthog.apiKey,
          event: eventName,
          properties: { ...properties, distinct_id: userId || anonymousId || 'anonymous' },
          distinct_id: userId || anonymousId || 'anonymous',
        }),
      });
    } catch (_) {}
  }
}

export const events = {
  signup: 'user_signup',
  login: 'user_login',
  feature_used: 'feature_used',
  ai_used: 'ai_used',
  conversion_to_paid: 'conversion_to_paid',
  upgrade_click: 'upgrade_click',
};
