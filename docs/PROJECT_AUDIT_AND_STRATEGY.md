# UniPilot — Full Project Audit & Product Strategy

## SECTION 1: FULL PROJECT AUDIT

### 1.1 Architecture Quality

**Current state:**
- **Monorepo-style single app:** `frontend-vite` contains both Vite/React frontend and Express API in one repo. Server runs from `server/index.js`; static build served from `dist/`.
- **No clear separation of domains:** Business logic (grade computation, finalize, app notes) lives in `index.js` alongside route registration. Routes are split by resource (auth, catalog, student, planner, ai, study, etc.) but core domain logic is centralized.
- **Database layer:** `db.js` provides a `prepare().run/get/all` API with `?` → `$1,$2` conversion for PostgreSQL. No ORM; raw SQL everywhere. Connection pool (max 20) is reasonable.

**Improvements:**
- Extract domain logic into service modules (e.g. `server/services/gradeService.js`, `server/services/subscriptionService.js`) and keep routes thin.
- Introduce a config module (`server/config/index.js`) for NODE_ENV-based settings and secrets.
- Consider splitting API and frontend into separate deployable units at scale (e.g. API on Render, frontend on CDN).

### 1.2 Code Structure

**Strengths:**
- Routes are modular under `server/routes/`.
- Middleware (auth, validate) is reusable.
- Frontend uses React Router, lazy loading for heavy pages (Analytics, Infographics, Theses, AdminPanel).

**Weaknesses:**
- `server/index.js` is ~766 lines: too large. Mix of app setup, rate limiting, CORS, inline route handlers (dashboard, courses, grades, notes, analytics, tasks, insights), and business logic.
- No shared error-handling middleware (try/catch in each handler).
- No request ID or correlation ID for tracing.
- Frontend API calls are likely scattered (no single API client with interceptors for token refresh, error handling).

**Improvements:**
- Move all inline routes in `index.js` into dedicated route files (e.g. `routes/dashboard.js`, `routes/courses.js`, `routes/grades.js`, `routes/notes.js`).
- Add global error middleware and async handler wrapper.
- Add `X-Request-Id` and structured logging per request.

### 1.3 Scalability Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Single server process | No horizontal scaling without sticky sessions or stateless design | Keep JWT stateless; ensure no in-memory session store. Use Redis for rate limit and cache. |
| All AI calls synchronous | Long request duration under load | Queue AI jobs (BullMQ); return job ID and poll or webhook for result. |
| No connection pooling per service | DB connection exhaustion under concurrency | Pool size 20 is OK for one instance; document and tune for multi-instance. |
| Large payloads (30mb JSON) | Memory and timeouts | Cap body size per route; use multipart upload for files; stream where possible. |
| No CDN for static assets | Latency and bandwidth on origin | Serve `dist/` from CDN (e.g. CloudFront, Cloudflare) in production. |

### 1.4 Security Issues

| Issue | Severity | Fix |
|-------|----------|-----|
| JWT in memory only (no refresh token) | Medium | Add refresh token (httpOnly cookie or separate endpoint) and short-lived access token. |
| No CSRF for state-changing ops | Medium | Use SameSite cookies and/or CSRF token for cookie-based auth; with Bearer-only API, risk is lower but document. |
| Default seed users (admin/student) with fixed passwords | High in prod | Remove or disable seed in production; use env-based bootstrap. |
| `FRONTEND_ORIGIN` optional in prod | Medium | Require in production and validate strictly. |
| Rate limit per IP only | Low | Add per-user rate limit for expensive endpoints (AI, export). |
| No explicit input length limits on many fields | Low | Enforce max lengths in schema and DB (e.g. content TEXT with application-level truncation). |
| Groq key fallback from file | Low | Prefer env-only in production; remove file fallback. |

### 1.5 Performance Issues

- **No caching:** Dashboard, catalog, and course list hit DB every time. Add Redis cache with TTL for read-heavy, rarely changing data.
- **N+1 in places:** e.g. modules + module items loaded in a loop; use batch queries or JOINs.
- **No compression:** Enable `express compression` middleware for JSON and static.
- **Large bundle:** Ensure code splitting and lazy loading for all heavy pages (already partially done).
- **No CDN:** Static assets and API on same origin; add CDN and cache headers.

### 1.6 Missing Components

- **Subscriptions and billing:** No tables or logic for plans, usage, or payments.
- **Usage metering:** No tracking of AI requests per user/plan for limits.
- **Structured logging:** Only `console.log`/`console.error`; no log levels or JSON logs.
- **Error tracking:** Sentry is referenced (VITE_SENTRY_DSN) but not clearly integrated on backend.
- **Health checks:** `/api/health` and `/api/ready` exist but no readiness for Redis or external services.
- **Migrations:** Schema changes are inline in `initDb()` (ALTER TABLE, CREATE TABLE); no versioned migration runner.
- **Secrets:** All from env; no Vault or managed secrets (acceptable for Render; document rotation).

### 1.7 Technical Debt

- **Placeholder conversion:** `db.prepare` uses `?` then converts to `$1,$2`; easy to get param order wrong. Consider named parameters or a small query builder.
- **Mixed response shapes:** Some endpoints return `{ detail: '...' }`, others `{ error: '...' }`; standardize (e.g. always `detail` for errors).
- **No API versioning:** `/api/...` with no `/api/v1/`; add when breaking changes are needed.
- **Delete account:** Long sequential deletes; consider transaction and background job for very large accounts.

### 1.8 Database Design Flaws

- **planner_events / planner_tasks:** `start_date`, `end_date`, `due_date` as TEXT; use DATE or TIMESTAMPTZ for indexing and range queries.
- **No soft delete:** Deletes are hard; consider `deleted_at` for audit and recovery.
- **Missing tables:** No `subscriptions`, `usage_tracking`, `ai_requests`, `analytics_events` for SaaS and observability.
- **users table:** No `stripe_customer_id`, `plan_id`, or `email_verified_at`; needed for billing and auth.
- **Indexes:** Good coverage on user_id, course_id, session_id; add composite indexes for common filters (e.g. user_id + created_at for activity).

---

## SECTION 2: PRODUCT STRATEGY — CORE PRODUCT FOCUS

### 2.1 Problem with Current Scope

The product currently includes: GPA tracking, study planner, flashcards, AI summarization, notes, voice tools, academic coaching, theses/research, diagrams, infographics, gamification, notifications. This dilutes focus and makes it hard to position, onboard, and scale.

### 2.2 Proposed Core Product: **AI Lecture-to-Study System**

**One sentence:** Turn any lecture or material into a structured study path: summary → flashcards → quiz → study plan.

**Flow:**
1. **Input:** Lecture (paste text, upload PDF/DOC/PPT, or link).
2. **AI Summary:** One-click summary with key points (existing summarization).
3. **Flashcards:** Auto-generated from summary or source (existing).
4. **Quiz:** Auto-generated quiz to self-test (existing).
5. **Study Plan:** Suggested schedule (e.g. “review cards in 3 days”) integrated with planner.

This aligns with the existing study tools (upload, summarize, flashcards, quiz) and planner; other features become secondary or “power user” add-ons.

### 2.3 Product Logic

- **Primary persona:** University student who has lecture notes or slides and wants to study efficiently.
- **Core loop:** Upload/paste → Summarize → Flashcards → Quiz → (optional) Add to planner.
- **Monetization:** Free = limited AI runs per month; Pro = unlimited AI; Student = discounted Pro with verification.
- **Feature hierarchy:**
  - **Tier 1 (core):** Upload, Summarize, Flashcards, Quiz, minimal Planner link.
  - **Tier 2:** Full Planner, GPA tracking, Notes, AI Coach.
  - **Tier 3:** Voice, Theses, Diagrams, Infographics, Gamification.

### 2.4 Redesigned Feature Set Around One Experience

| Feature | Role |
|--------|------|
| Study Tools (upload, summarize, flashcards, quiz) | Core experience |
| Planner (tasks, events) | Core (schedule reviews) |
| GPA / Grades / Courses | Supporting (context for student) |
| AI Coach | Supporting (Q&A about material) |
| Notes | Supporting (attach to courses) |
| Voice, Theses, Diagrams, Infographics | Optional / power user |
| Gamification | Engagement layer |

Implementation priority: ensure the “Lecture → Summary → Flashcards → Quiz → Plan” flow is seamless and measurable (funnel analytics), then add billing and usage limits on AI steps.

---

*Next: Sections 3–14 are implemented in code (config, migrations, Stripe, security, tests, DevOps, admin, AI, docs).*
