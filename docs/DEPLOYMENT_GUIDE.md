# UniPilot — Production Deployment Guide

## Environments

- **Development:** `NODE_ENV=development` (default). Uses dev JWT fallback if `JWT_SECRET` not set. CORS allows all.
- **Test:** `NODE_ENV=test`. Use a separate DB and optional mock Stripe.
- **Production:** `NODE_ENV=production`. Requires `JWT_SECRET` (≥32 chars), `DATABASE_URL`, and `FRONTEND_ORIGIN` for CORS.

## Required Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Min 32 characters; used to sign JWTs |
| `FRONTEND_ORIGIN` | Comma-separated allowed origins (e.g. `https://yourapp.onrender.com`) |
| `VITE_BACKEND_URL` | Set at **build** time; full app URL so frontend calls correct API (e.g. `https://yourapp.onrender.com`) |
| `APP_URL` | Same as above; used for Stripe success/cancel/return URLs (e.g. `https://yourapp.onrender.com`) |

## Optional (SaaS / Observability)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key for checkout/portal |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_PUBLISHABLE_KEY` | For frontend Stripe.js |
| `STRIPE_PRO_PLAN_PRICE_ID` | Stripe Price ID for Pro plan |
| `STRIPE_STUDENT_PLAN_PRICE_ID` | Stripe Price ID for Student plan |
| `AI_FREE_MONTHLY_LIMIT` | Free tier AI requests per month (default 50) |
| `SENTRY_DSN` | Backend error tracking |
| `VITE_SENTRY_DSN` | Frontend error tracking (build-time) |
| `POSTHOG_API_KEY` | Product analytics |
| `REDIS_URL` | Redis for cache/queues (optional) |
| `LOG_LEVEL` | `error` \| `warn` \| `info` \| `debug` |

## Render

1. Create a **Web Service** and connect the repo. Set **Root Directory** to `frontend-vite` if repo root is above it.
2. **Build command:** `npm install && npm run build`
3. **Start command:** `node server/index.js`
4. Add a **PostgreSQL** database and link it; set `DATABASE_URL` from the database’s connection string.
5. In **Environment**, set all required and desired optional variables. For Stripe webhook, use the webhook URL: `https://<your-service>.onrender.com/api/billing/webhook` and put the signing secret in `STRIPE_WEBHOOK_SECRET`.
6. Ensure `VITE_BACKEND_URL` and `APP_URL` are set to your Render service URL (e.g. `https://unipilot.onrender.com`) so the build and Stripe redirects work.

**Full step-by-step guide in Arabic:** [docs/RENDER_DEPLOY_AR.md](RENDER_DEPLOY_AR.md)

See **render.yaml** for blueprint (one web service + one Postgres).

## Docker

- **Dockerfile** builds the app and runs the server. Build with e.g.:
  `docker build --build-arg VITE_BACKEND_URL=https://api.example.com -t unipilot .`
- Run with `-e DATABASE_URL=... -e JWT_SECRET=...` and any other env. Expose port 3000.

## Stripe Webhook

- The webhook route is `POST /api/billing/webhook` and **must** receive the **raw** request body. The app mounts this route with `express.raw({ type: 'application/json' })` before `express.json()`.
- In Stripe Dashboard → Webhooks, add endpoint URL and subscribe to `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, and optionally `invoice.payment_failed`.
- Put the signing secret in `STRIPE_WEBHOOK_SECRET`.

## Health Checks

- **Liveness:** `GET /api/health` → `{ "status": "ok" }`.
- **Readiness:** `GET /api/ready` → DB connectivity; returns 503 if DB is down.

Use these for Kubernetes or Render health checks.
