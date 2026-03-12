# UniPilot — Developer Setup

## Prerequisites

- **Node.js** 18+ (recommend 20 LTS)
- **PostgreSQL** 14+ (local or cloud: Neon, Supabase, Render)
- **Git**

## 1. Clone and install

```bash
git clone <repo-url>
cd frontend-vite   # or project root if mono-repo
npm install
```

## 2. Environment

Copy the example env and set required variables:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL URL, e.g. `postgresql://user:pass@localhost:5432/unipilot` |
| `JWT_SECRET` | Yes (prod) | Min 32 characters; use a long random string for dev too |
| `GROQ_API_KEY` | No (AI disabled) | From [Groq Console](https://console.groq.com) for AI features |
| `VITE_BACKEND_URL` | No | Defaults to `http://localhost:3001` in dev when not set |
| `STRIPE_SECRET_KEY` | No | For billing; optional for local dev |
| `STRIPE_WEBHOOK_SECRET` | No | For Stripe webhooks |
| `SENTRY_DSN` | No | Backend error tracking |
| `POSTHOG_API_KEY` | No | Product analytics |

For **local dev**, a minimal `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unipilot
JWT_SECRET=dev-secret-at-least-32-characters-long
```

## 3. Database

Create a database and run the app once; schema and migrations run on startup:

```bash
createdb unipilot
npm run server
```

Or use Docker:

```bash
docker run -d --name unipilot-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=unipilot -p 5432:5432 postgres:16-alpine
```

Then start the server; `initDb()` applies `schema-pg.sql` and `server/migrations/*.sql`.

## 4. Run the app

**Option A — API and frontend together (recommended):**

```bash
npm run dev:all
```

- API: http://localhost:3001  
- Frontend (Vite): http://localhost:5173  
- Use the frontend; it will proxy or use `VITE_BACKEND_URL` to talk to the API.

**Option B — Separate terminals:**

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

Set `VITE_BACKEND_URL=http://localhost:3001` in `.env` so the frontend hits the local API.

## 5. Build and preview

```bash
npm run build
npm run preview
```

Serves the built app; point it at your API via `VITE_BACKEND_URL` at build time.

## 6. Tests

- **Unit + service tests:** `npm run test` or `npm run test:run`
- **API tests (needs DB):** `npm run test:api` (set `DATABASE_URL` in `.env`)
- **Coverage:** `npm run test:run -- --coverage`
- **E2E (Playwright):** `npm run test:e2e` (start server separately or use `webServer` in playwright.config.js)

## 7. Linting and format

If ESLint/Prettier are configured:

```bash
npm run lint
npm run format
```

## 8. Seed data (optional)

```bash
npm run seed
```

Creates catalog and sample data if your seed script is set up.

## 9. Stripe (billing) local testing

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3001/api/billing/webhook`
4. Use the webhook signing secret from the CLI in `.env` as `STRIPE_WEBHOOK_SECRET`.
5. Create Products/Prices in Stripe Dashboard and set `STRIPE_PRO_PLAN_PRICE_ID` and `STRIPE_STUDENT_PLAN_PRICE_ID`.

## 10. Troubleshooting

- **DB connection refused:** Ensure PostgreSQL is running and `DATABASE_URL` is correct.
- **JWT_SECRET required:** In production the server throws if `JWT_SECRET` is missing or &lt; 32 chars.
- **AI 503:** Set `GROQ_API_KEY`; some regions may be restricted by Groq.
- **Migration errors:** Ensure `server/migrations/` is present and the DB user can create tables and indexes.
- **CORS in dev:** Backend allows all origins in development; in production set `FRONTEND_ORIGIN`.
