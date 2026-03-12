# UniPilot — Production Readiness Checklist

Use this checklist before launching to thousands of users. Each section maps to the 14-section SaaS transformation.

**للنشر على Render خطوة بخطوة (عربي):** [docs/RENDER_DEPLOY_AR.md](RENDER_DEPLOY_AR.md)

---

## Section 1 – Audit & product focus

- [ ] Audit doc read: `docs/PROJECT_AUDIT_AND_STRATEGY.md`
- [ ] Core product agreed: **AI Lecture-to-Study** (Lecture → Summary → Flashcards → Quiz → Plan)
- [ ] Feature prioritization (Tier 1/2/3) aligned with roadmap

---

## Section 2 – Product strategy

- [ ] Single core flow documented and communicated
- [ ] Free / Pro / Student positioning and limits clear

---

## Section 3 – SaaS architecture & observability

- [ ] `server/config/index.js` used for NODE_ENV-based config
- [ ] Secrets only from env (no hardcoded keys)
- [ ] Structured logging: `server/lib/logger.js`, `LOG_LEVEL` set
- [ ] Error tracking: `SENTRY_DSN` set (backend); optional `VITE_SENTRY_DSN` (frontend)
- [ ] Request ID: `server/middleware/requestId.js` in use
- [ ] Analytics: `server/lib/analytics.js`; signup/login tracked; optional PostHog
- [ ] Observability doc: `docs/OBSERVABILITY.md` reviewed

---

## Section 4 – Payments & subscriptions

- [ ] Stripe account and Products/Prices created (Pro, Student)
- [ ] Env set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRO_PLAN_PRICE_ID`, `STRIPE_STUDENT_PLAN_PRICE_ID`
- [ ] **On Render:** `APP_URL` set to full app URL (same as `VITE_BACKEND_URL`) for Stripe redirects
- [ ] Webhook endpoint: `POST /api/billing/webhook` (raw body) registered in Stripe Dashboard
- [ ] Plans/subscriptions/usage tables present (migrations run)
- [ ] Checkout and Customer Portal tested (upgrade, manage, cancel)
- [ ] Free tier AI limit enforced (402 when exceeded)

---

## Section 5 – Database

- [ ] PostgreSQL schema and migrations applied (`server/migrations/*.sql`)
- [ ] Indexes in place for usage, AI requests, analytics (see migration file)
- [ ] `DATABASE_URL` set and connection pool size appropriate for load

---

## Section 6 – Security

- [ ] `docs/SECURITY.md` reviewed
- [ ] `JWT_SECRET` ≥ 32 characters in production
- [ ] `FRONTEND_ORIGIN` set for CORS in production
- [ ] Helmet and rate limiting enabled (global + auth)
- [ ] Input validation (Zod) on auth and critical endpoints
- [ ] No raw SQL concatenation; parameterized queries only
- [ ] Stripe webhook signature verified

---

## Section 7 – Testing

- [ ] Unit tests: `npm run test:unit` (passing)
- [ ] API tests: `npm run test:api` with `DATABASE_URL` (passing)
- [ ] E2E: `npm run test:e2e` (optional; Playwright)
- [ ] Coverage: `npm run test:run -- --coverage`; critical paths covered
- [ ] CI: `.github/workflows/ci.yml` — unit, API (Postgres), build (and optionally E2E) green

---

## Section 8 – Performance

- [ ] Compression middleware enabled when `compression` package available
- [ ] Redis cache: `REDIS_URL` set; catalog list cached (`server/lib/cache.js`, catalog route)
- [ ] Frontend: lazy loading for heavy routes (Analytics, Infographics, Theses, Admin)
- [ ] CDN for static assets (e.g. Render CDN or CloudFront) if needed

---

## Section 9 – Analytics

- [ ] `track(events.signup/login)` called from auth routes
- [ ] Optional: `POSTHOG_API_KEY` set; events in `analytics_events` and PostHog
- [ ] Key events defined: signup, login, feature_used, ai_used, conversion_to_paid

---

## Section 10 – DevOps

- [ ] CI/CD: GitHub Actions running on push/PR (lint/test/build)
- [ ] Deployment: Render (or AWS/Railway) per `docs/DEPLOYMENT_GUIDE.md`
- [ ] Env configs: production env vars set in host (no `.env` committed)
- [ ] Docker: `Dockerfile` builds and runs; `VITE_BACKEND_URL` build-arg set for production URL

---

## Section 11 – Scalability

- [ ] `REDIS_URL` set when using cache/queues
- [ ] Job queue: `server/lib/queue.js` (BullMQ); workers started if using async AI jobs
- [ ] DB pool size and connection limits tuned for expected concurrency

---

## Section 12 – Admin panel

- [ ] Admin: user list with role and plan; role and plan editable
- [ ] Admin: “AI Usage” and “AI Cost (last 7 days)” cards (GET /admin/usage, /admin/ai-costs)
- [ ] Admin: send notifications to students

---

## Section 13 – AI system

- [ ] Prompt templates: `server/ai/prompts.js` (optional use in groq.js)
- [ ] AI quota: `requireAiQuota` on study/AI/notes routes; usage incremented and logged
- [ ] Docs: `docs/AI_PIPELINE.md` (caching, limits, fallback, cost)

---

## Section 14 – Documentation

- [ ] `documentation/ARCHITECTURE.md` — high-level design and SaaS/billing/observability
- [ ] `docs/DEVELOPER_SETUP.md` — local setup, env, DB, test, Stripe local
- [ ] `docs/DEPLOYMENT_GUIDE.md` — production env, Render/Docker, webhook
- [ ] `docs/SECURITY.md` — security overview and checklist
- [ ] `docs/OBSERVABILITY.md` — logging, Sentry, health, metrics
- [ ] `openapi.yaml` — API spec including billing paths
- [ ] `docs/PRODUCTION_SAAS_SUMMARY.md` — summary of all 14 sections

---

## Launch gate

- [ ] All “Section N” items above verified or explicitly deferred
- [ ] Production env (Render/host) has: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, Stripe vars (if billing live)
- [ ] No default/demo passwords or secrets in production
- [ ] Backup and restore procedure for DB documented and tested
