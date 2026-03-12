# UniPilot — Testing Strategy

## Goals

- **Unit tests:** Business logic (grade utils, subscription limits, validation).
- **Integration/API tests:** HTTP endpoints with test DB or mocks.
- **E2E tests:** Critical user flows (login, dashboard, study flow) in a real browser.
- **Coverage target:** High coverage on core paths; 99%+ is aspirational and should focus on critical branches (auth, billing, AI quota).

## Tools

| Layer | Tool | Location |
|-------|------|----------|
| Unit / API | **Vitest** | `*.test.js` next to source or in `server/**` |
| API | **Supertest** | `server/api.test.js` |
| E2E | **Playwright** | `e2e/*.spec.js`, `playwright.config.js` |

## Unit Tests

- **server/lib/gradeUtils.test.js** — Already present; extend for edge cases.
- **server/middleware/validate.test.js** — Validation schemas (register, login).
- **server/services/subscriptionService.test.js** — `getPlanLimits`, `canUseAi` (mock DB or test DB).

Run: `npm run test` or `npm run test:run`.

## API Tests (Supertest)

- **server/api.test.js** — Request `GET /api/health`, `GET /api/ready`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` with token. Use a test DB or in-memory SQLite if desired; for simplicity, use real test PostgreSQL with a dedicated database.

Run: `npm run test:api`.

## E2E Tests (Playwright)

- **e2e/smoke.spec.js** — Smoke: load landing, optional login, dashboard.
- Add: **e2e/billing.spec.js** — Pricing page, checkout redirect (mock or test Stripe).
- Add: **e2e/study-flow.spec.js** — Login → Study Tools → upload or paste → summarize (if AI enabled).

Run: `npm run test:e2e`. Ensure app is running or use `webServer` in Playwright config.

## CI (GitHub Actions)

- **.github/workflows/ci.yml** — Lint, unit tests, API tests. Optionally start Postgres service and run migrations; run E2E only on main or with Playwright install.
- Env for CI: `NODE_ENV=test`, `DATABASE_URL` (e.g. Postgres service container), `JWT_SECRET` (min 32 chars).

## Coverage

- Vitest: `coverage` option in `vitest.config.js`; aim for 80%+ on server/lib and server/services; 99%+ on security-critical paths (auth, subscription checks).
- Exclude generated code and config from coverage.

## Security-Related Tests

- Auth: invalid token, expired token, missing token → 401.
- Billing: webhook with invalid signature → 400.
- Rate limit: exceed limit → 429 (or 403 depending on config).
- AI quota: over free limit → 402 when `requireAiQuota` is used.
