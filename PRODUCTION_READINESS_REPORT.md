# UniPilot — Production Readiness & Quality Report

**Version:** 0.1.0  
**Scope:** `frontend-vite` (Vite + React SPA + Express API) and `render.yaml`  
**Purpose:** Full analysis for deployment, sale, or production release.

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|--------|
| **Functionality** | ✅ Ready | Full feature set: auth, courses, planner, AI coach, study tools, admin, i18n (AR/EN). |
| **Database** | ✅ Ready | PostgreSQL with schema, init, and setup docs. |
| **Deployment** | ⚠️ Partial | Render blueprint exists; env and DB must be set in Dashboard. |
| **Security** | ⚠️ Gaps | JWT secret fallback, no rate limit/helmet; secrets not in repo. |
| **Testing** | ❌ Missing | No unit/integration/e2e tests or CI. |
| **Documentation** | ✅ Good | POSTGRES_SETUP, DEPLOY_RENDER, AI_SETUP, ADMIN_ACCESS. |
| **Performance** | ⚠️ Can improve | No route-level code splitting (lazy load). |
| **Legal / Compliance** | ⚠️ Unspecified | No Terms, Privacy Policy, or License in repo. |

**Verdict:** The app is **feature-complete and deployable** for a controlled/MVP launch. For **commercial sale or high-traffic production**, address security hardening, testing, and legal pages.

---

## 2. Architecture Overview

- **Stack:** Node.js (≥18), Vite 5, React 18, Express 4, PostgreSQL (pg), JWT, bcrypt, Groq SDK.
- **Layout:** Monorepo-style: one repo with `frontend-vite` containing both Vite app and Express server.
- **Deploy model:** Single Render Web Service: `npm install && npm run build` then `node server/index.js` (serves API + static `dist/`).
- **API:** All under `/api/*`; auth via `Authorization: Bearer <token>`; role-based access (student / admin).

---

## 3. Requirements & Features Checklist

### 3.1 Functional Requirements

| Requirement | Implemented | Location / Notes |
|-------------|-------------|-------------------|
| User registration & login | ✅ | `server/routes/auth.js`, `src/lib/AuthContext.jsx` |
| JWT auth + protected routes | ✅ | `server/middleware/auth.js`, `ProtectedRoute` / `AdminRoute` in `App.jsx` |
| Dashboard (courses, GPA, tasks) | ✅ | `Dashboard.jsx`, `/api/dashboard/summary` |
| Course catalog (admin) & student courses | ✅ | `catalogRouter`, `studentRouter`, pages Courses / CourseDetails |
| Grades & grade items | ✅ | Inline routes in `server/index.js`, gradeUtils |
| Academic history & semesters | ✅ | `semestersRouter`, AcademicHistory page |
| Planner (events, tasks, daily view) | ✅ | `plannerRouter`, Planner page, generate-plan, suggest-next |
| AI Coach (chat, context) | ✅ | `aiRouter`, AICoach page, buildCoachContext |
| Study tools (docs, summaries, flashcards, quiz, mind map) | ✅ | `studyRouter`, StudyTools and related pages |
| Voice (sessions, upload, summarize) | ✅ | `voiceRouter`, VoiceToText page |
| TTS (speak, extract, tashkeel) | ✅ | `ttsRouter`, ReadTexts and related |
| Theses / research help | ✅ | `thesesRouter`, Theses page |
| Diagrams / infographics | ✅ | `diagramsRouter`, Infographics page |
| Notes (CRUD, improve) | ✅ | Inline routes, Notes page |
| Notifications (student + admin) | ✅ | `notificationsRouter`, AdminNotifications, StudentAdminNotifications |
| Admin panel (users, catalog, stats) | ✅ | `adminRouter`, AdminPanel |
| Settings (profile, name) | ✅ | PATCH `/api/auth/settings`, Settings page |
| i18n (Arabic / English) | ✅ | `src/lib/translations.js`, LanguageContext |
| Theme (light / dark) | ✅ | ThemeContext, next-themes |
| Health check | ✅ | GET `/api/health` → `{ status: 'ok' }` |

### 3.2 Non-Functional Requirements

| Requirement | Status | Notes |
|--------------|--------|--------|
| PostgreSQL as primary DB | ✅ | `server/db.js`, `schema-pg.sql`, initDb on startup |
| Env-based config (no hardcoded secrets) | ✅ | `.env.example`, Render env vars documented |
| Responsive UI | ✅ | Tailwind, Radix, layout components |
| API error responses | ⚠️ | Consistent `{ detail }`; no global error handler for uncaught errors |
| Input validation (server) | ⚠️ | Basic (e.g. email/password required); no schema validation (e.g. Zod/Joi) on all routes |

---

## 4. Security Analysis

### 4.1 Implemented

- **Auth:** JWT (7d expiry), bcrypt password hashing, auth middleware on protected routes.
- **Admin:** `requireAdmin` middleware for admin-only routes.
- **CORS:** `cors({ origin: true, credentials: true })` (allows any origin; acceptable if only same-origin or trusted frontend).
- **Secrets:** `.env` not committed; `.env.example` documents vars; Render uses Dashboard env.
- **Body size:** `express.json({ limit: '25mb' })` for large payloads (TTS, etc.).

### 4.2 Gaps (Must Fix for Production / Sale)

| Issue | Risk | Recommendation |
|-------|------|-----------------|
| **JWT_SECRET fallback** | High | `server/middleware/auth.js` uses `process.env.JWT_SECRET \|\| 'unipilot-dev-secret-change-in-production'`. In production, **require** JWT_SECRET (no fallback) and set it in Render/env. |
| **No rate limiting** | Medium | Add `express-rate-limit` (e.g. on `/api/auth/login`, `/api/auth/register`, and optionally global) to mitigate brute-force and abuse. |
| **No security headers** | Medium | Add `helmet` for X-Content-Type-Options, X-Frame-Options, etc. |
| **No request validation** | Medium | Validate and sanitize body/query on all routes (e.g. Zod + express middleware) to reduce injection and bad data. |
| **CORS `origin: true`** | Low | For production, set `origin` to your frontend origin(s) if known. |

### 4.3 Optional

- **HTTPS:** Handled by Render.
- **CSRF:** Less critical for token-based API; ensure no cookies used for auth (currently Bearer only).
- **SQL injection:** Parameterized queries via `db.prepare()` and `?` → `$1,$2` in db.js; low risk if no raw SQL with user input.

---

## 5. Deployment (Render)

### 5.1 render.yaml (frontend-vite)

- **Service:** One `web` service, Node runtime.
- **Build:** `npm install && npm run build`.
- **Start:** `node server/index.js`.
- **Env:** Only `NODE_ENV=production` in file; `VITE_BACKEND_URL` and `GROQ_API_KEY` must be set in Dashboard.

### 5.2 Required Environment Variables (Render Dashboard)

| Key | Required | Description |
|-----|----------|-------------|
| `NODE_ENV` | Yes | `production` (can be in render.yaml) |
| `VITE_BACKEND_URL` | Yes | Full app URL (e.g. `https://unipilot.onrender.com`) for frontend API base; set **before first deploy** (baked at build time). |
| `GROQ_API_KEY` | For AI | Required for AI Coach and other Groq features. |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Render PostgreSQL or external). |
| `JWT_SECRET` | Yes | Strong random secret in production (no fallback). |
| `UNSPLASH_ACCESS_KEY` | Optional | For presentation slides / images. |

### 5.3 Database on Render

- Use **Render PostgreSQL** (or Neon, Supabase, etc.); create DB and user, then set `DATABASE_URL`.
- Run schema: app runs `initDb()` on startup and executes `schema-pg.sql` (creates tables if not exist).
- For first-time DB creation from scratch, you can use `server/setup-db.sql` locally or adapt for cloud.

### 5.4 Gaps in render.yaml

- **DATABASE_URL** and **JWT_SECRET** not mentioned in comments; add them to the blueprint comments or doc.
- **rootDir:** If repo root is parent of `frontend-vite`, ensure Render "Root Directory" is `frontend-vite` (as in DEPLOY_RENDER.md).

---

## 6. Code Quality & Standards

### 6.1 Structure

- **Backend:** Clear separation: `server/routes/*`, `server/middleware`, `server/lib`, `server/ai`, `server/db.js`.
- **Frontend:** `src/pages`, `src/components`, `src/lib`, `src/hooks`; path alias `@/` → `src/`.
- **Consistency:** ES modules throughout; async/await; single entry `server/index.js`.

### 6.2 Error Handling

- **API:** Routes use `try/catch` and `res.status(x).json({ detail })` in many places; some routes may throw and need a global error middleware.
- **Frontend:** Axios errors surfaced to user (e.g. toasts); AuthContext handles 401 for logout.
- **Recommendation:** Add a central `app.use((err, req, res, next) => { ... })` in `server/index.js` to log and return 500 with a generic message.

### 6.3 i18n

- **Coverage:** `translations.js` has `en` and `ar` with broad keys (auth, nav, dashboard, academicHistory, etc.).
- **Usage:** LanguageContext + `t()` in components; RTL/layout considerations likely in layout/theme.

### 6.4 Accessibility & UX

- Radix UI components (keyboard, ARIA) used; forms with labels and structure.
- No formal a11y audit or automated tests (e.g. axe) referenced.

---

## 7. Testing

| Type | Status | Notes |
|------|--------|--------|
| Unit (backend) | ❌ | No Jest/Vitest or test scripts in package.json. |
| Unit (frontend) | ❌ | No React Testing Library or component tests. |
| Integration (API) | ❌ | No supertest or similar. |
| E2E | ❌ | No Playwright/Cypress. |
| CI | ❌ | No GitHub Actions or other CI. |

**Recommendation for production/sale:** Add at least:
- Unit tests for auth, gradeUtils, and critical API handlers.
- Smoke/health check in CI (e.g. build + `GET /api/health`).
- Optional E2E for login → dashboard and one critical flow.

---

## 8. Performance

- **Build:** Vite production build; no analysis script (e.g. `vite build --mode production` only).
- **Code splitting:** No `React.lazy` or dynamic imports for routes; all pages in main bundle.
- **Recommendation:** Lazy-load heavy pages (e.g. Theses, Infographics, Admin, Analytics) to reduce initial load.
- **API:** No caching headers or CDN mentioned; static assets served from same server (acceptable for MVP).

---

## 9. Documentation

| Document | Purpose |
|----------|---------|
| `POSTGRES_SETUP.md` | PostgreSQL install, DB/user creation, DATABASE_URL, run app. |
| `DEPLOY_RENDER.md` | Render setup (one Web Service or two), env vars, CSP fix, troubleshooting. |
| `AI_SETUP.md` | AI/Groq key setup. |
| `ADMIN_ACCESS.md` | Admin accounts and access. |
| `server/README.md` | Server-side notes (if any). |
| `.env.example` | Lists VITE_BACKEND_URL, GROQ_API_KEY, UNSPLASH_ACCESS_KEY, DATABASE_URL. |

**Missing for “product” readiness:**  
- Single **README.md** at project root: quick start, env table, deploy in 3 steps, link to other docs.  
- Optional: short API overview (list of main routes and auth requirements).

---

## 10. Legal & Compliance (Sale / Public Launch)

| Item | Status | Recommendation |
|------|--------|-----------------|
| Terms of Service | ❌ | Add page or link; template or lawyer-drafted. |
| Privacy Policy | ❌ | Required if collecting email/password and any PII; describe data use, storage, Groq/third parties. |
| License | ❌ | Add LICENSE file (e.g. MIT, or proprietary). |
| Cookie / consent banner | ⚠️ | If you use cookies beyond auth token storage, consider a simple consent note. |
| Data retention / deletion | ⚠️ | Document in Privacy Policy; consider “Delete my account” in Settings. |

---

## 11. Dependency Health

- **package.json:** No `npm audit` or `overrides` mentioned; lockfile present.
- **Recommendation:** Run `npm audit` and fix critical/moderate issues; document in README or CI.
- **Engines:** `"node": ">=18"` specified; aligns with Render Node runtime.

---

## 12. Production Readiness Checklist (Summary)

Use this as a pre-launch list.

### Must-have before production / sale

- [ ] **JWT_SECRET** set in production env with no fallback in code (or fail fast if missing).
- [ ] **DATABASE_URL** set (e.g. Render PostgreSQL or external).
- [ ] **VITE_BACKEND_URL** set on Render before first build.
- [ ] Add **rate limiting** (at least on auth routes).
- [ ] Add **helmet** (or equivalent security headers).
- [ ] **Privacy Policy** and **Terms of Service** (pages or links).
- [ ] **README.md** with quick start and env table.

### Should-have

- [ ] Global **error middleware** in Express.
- [ ] **Input validation** (e.g. Zod) on auth and critical routes.
- [ ] **CORS** origin restricted to known frontend URL(s) in production.
- [ ] **License** file (LICENSE).
- [ ] Basic **smoke test** or CI step (build + health check).

### Nice-to-have

- [ ] Unit tests for auth and grade logic.
- [ ] Route-level **code splitting** (lazy load) for large pages.
- [ ] **API overview** doc (routes + auth).
- [ ] “Delete my account” and data export in **Settings**.

---

## 13. Conclusion

UniPilot is **feature-complete**, **well-structured**, and **deployable** on Render with PostgreSQL. For a **controlled or MVP launch**, fix the **security items** (JWT_SECRET, rate limit, helmet) and add **legal pages** (Privacy, Terms) and a **README**. For **commercial sale or high-traffic use**, add **testing**, **validation**, and **error handling** as above; the report and checklist above give a clear path to production-ready quality.
