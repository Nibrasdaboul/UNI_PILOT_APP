/**
 * Middleware: ensure user has AI quota before calling next.
 * Returns 402 Payment Required when over free-tier limit (upgrade prompt);
 * optionally use 429 Too Many Requests for rate limit.
 */
import * as subscriptionService from '../services/subscriptionService.js';

export function requireAiQuota(req, res, next) {
  subscriptionService.canUseAi(req.user.id).then(({ allowed, remaining }) => {
    if (allowed) {
      req.aiQuota = { allowed: true, remaining };
      next();
      return;
    }
    res.status(402).json({
      detail: 'AI usage limit reached for this month. Upgrade to Pro for unlimited usage.',
      code: 'AI_LIMIT_EXCEEDED',
      remaining: 0,
    });
  }).catch((e) => {
    next(e);
  });
}
