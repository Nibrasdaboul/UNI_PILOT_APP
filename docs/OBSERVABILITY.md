# UniPilot — Observability

## Overview

Production observability for UniPilot: logging, error tracking, metrics, and health.

---

## 1. Structured logging

- **Module:** `server/lib/logger.js`
- **Env:** `LOG_LEVEL` = `error` | `warn` | `info` | `debug`
- **Production:** JSON lines (timestamp, level, message, meta) for log aggregation (e.g. Datadog, CloudWatch, ELK).
- **Development:** Human-readable lines with meta.

Usage:

```js
import logger from './lib/logger.js';
logger.info('User signed up', { userId: 1, plan: 'free' });
logger.error('Payment failed', { err: e, userId: 1 });
```

---

## 2. Error tracking (Sentry)

- **Module:** `server/lib/sentry.js`
- **Env:** `SENTRY_DSN` (backend), `VITE_SENTRY_DSN` (frontend, build-time)
- **Behavior:** When `SENTRY_DSN` is set, uncaught errors are sent to Sentry via `captureException()` in the Express error handler. Request path and method are attached.

Setup:

1. Create a project at [sentry.io](https://sentry.io).
2. Set `SENTRY_DSN` in production env.
3. Optionally set `VITE_SENTRY_DSN` and init `@sentry/react` in the frontend for client-side errors.

---

## 3. Request ID

- **Module:** `server/middleware/requestId.js`
- **Behavior:** Each request gets a unique `X-Request-Id` (or uses incoming `X-Request-Id`). Use it in logs and error context for tracing.

---

## 4. Health and readiness

- **GET /api/health** — Liveness: returns `{ status: 'ok' }`. No DB.
- **GET /api/ready** — Readiness: returns `{ status: 'ready', database: 'connected' }` or 503 if DB is down.

Use `/api/health` for liveness and `/api/ready` for readiness in Kubernetes or Render.

---

## 5. Metrics (Prometheus / OpenTelemetry)

Not implemented in-code. Recommendations:

- **Prometheus:** Expose a `/metrics` endpoint (e.g. `prom-client`) with HTTP request duration, count by route, and DB pool usage. Scrape from Prometheus; dashboards in Grafana.
- **OpenTelemetry:** Add `@opentelemetry/api`, `@opentelemetry/sdk-node`, and instrument Express and `pg`. Export to Jaeger, Zipkin, or OTLP collector.

Minimal in-app option: add a simple counter in memory (e.g. `requestsTotal`, `aiRequestsTotal`) and expose `GET /api/metrics` (plain text or JSON) for debugging; replace with Prometheus when scaling.

---

## 6. Analytics (product)

- **Module:** `server/lib/analytics.js`
- **Storage:** `analytics_events` table (event_name, user_id, properties_json, created_at)
- **Optional:** PostHog when `POSTHOG_API_KEY` is set; events are also sent to PostHog.

Events: `user_signup`, `user_login`, `feature_used`, `ai_used`, `conversion_to_paid`, `upgrade_click`. Call `track(eventName, props, userId)` from routes.

---

## 7. Checklist

- [ ] `LOG_LEVEL` set in production (e.g. `info`)
- [ ] `SENTRY_DSN` set for backend errors
- [ ] Liveness/readiness used by orchestrator (e.g. Render, K8s)
- [ ] (Optional) Prometheus or OpenTelemetry for metrics and tracing
- [ ] (Optional) PostHog or Mixpanel for product analytics
