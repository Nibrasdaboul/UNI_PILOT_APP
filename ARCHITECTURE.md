# UniPilot — Architecture (معمارية النظام)

High-level architecture for operators and buyers.

---

## 1. Overview

```
[Browser] ←→ [UniPilot Web App]
                   │
                   ├── Static: HTML, JS, CSS (Vite build → dist/)
                   └── API: Express server (Node.js)
                                │
                                └── PostgreSQL database
```

- **Single deployment unit:** One Node.js process serves both the API and the static frontend (from `dist/`). No separate front-end and back-end servers required for basic deployment.

---

## 2. Frontend

- **Stack:** React 18, Vite 5, React Router, Tailwind CSS, Radix UI.
- **Build:** `npm run build` produces static assets in `dist/`. The Express server serves these when `dist` exists.
- **API base URL:** At build time, the frontend is configured with `VITE_BACKEND_URL` (e.g. same origin on Render). All API calls go to `/api/*` on that origin.
- **Auth:** JWT stored in memory/sessionStorage; sent as `Authorization: Bearer <token>` on each API request.

---

## 3. Backend (API)

- **Stack:** Node.js (≥18), Express 4, PostgreSQL (via `pg`).
- **Entry:** `server/index.js`. Loads env (e.g. `dotenv`), initializes DB (`initDb()`), mounts routes, serves static `dist/`, and starts the HTTP server.
- **Routes:** All under `/api`:
  - **Public:** `GET /api/health`, `GET /api/ready` (readiness = DB check).
  - **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/settings`, `GET /api/auth/export`, `DELETE /api/auth/account`.
  - **Protected:** Dashboard, courses, planner, AI, study, voice, TTS, theses, diagrams, notifications, etc. (see API_OVERVIEW.md).
- **Middleware:** CORS, Helmet, global rate limit, auth rate limit on `/api/auth`, `express.json()`, then route-specific auth and admin checks.

---

## 4. Database

- **Engine:** PostgreSQL.
- **Schema:** Defined in `server/schema-pg.sql`. Applied automatically on startup via `initDb()` (creates tables if not exist). Optional migrations (e.g. `ALTER TABLE users ADD COLUMN terms_accepted_at`) run after schema apply.
- **Sensitive data:** Passwords stored only as bcrypt hashes. JWT secret and DB URL in environment variables only.

---

## 5. Data Flow (Sensitive Data)

- **Registration:** Email, password (hashed), full name, role, `terms_accepted_at` → `users` table.
- **Login:** Email + password → bcrypt compare → JWT issued.
- **Requests:** JWT verified → `req.user` → business logic and DB access scoped by `user_id` where applicable.
- **Export/delete:** User requests export or account deletion → API uses `req.user.id` to export or delete only that user’s data.

---

## 6. Deployment Topology (Example: Render)

- **Web Service:** One Node process. Build: `npm install && npm run build`. Start: `node server/index.js`.
- **PostgreSQL:** Separate Render PostgreSQL instance (or external). Connection string in `DATABASE_URL`.
- **TLS:** HTTPS terminated by Render. Application listens on HTTP internally.

For Docker/VPS deployment see **DEPLOY_DOCKER_VPS.md**.
