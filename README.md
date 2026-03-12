# UniPilot

**Your Smart Academic Companion** — dashboard, courses, grades, planner, AI coach, study tools, and more.

- **Stack:** Node.js 18+, Vite 5, React 18, Express, PostgreSQL
- **Deploy:** Single Render Web Service (API + static frontend)

---

## Quick start (local)

1. **Clone and install**
   ```bash
   cd frontend-vite
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set at least:
     - `DATABASE_URL` — PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/unipilot`)
     - `JWT_SECRET` — strong secret (min 32 chars) for production

3. **Database**
   - Create DB and user (see `documentation/POSTGRES_SETUP.md` or run `server/setup-db.sql`)
   - Schema is applied automatically on server start

4. **Run**
   ```bash
   npm run server    # API + frontend (build first: npm run build)
   # or
   npm run dev       # Vite dev (frontend only)
   npm run server    # in another terminal for API
   ```

5. **Open** `http://localhost:5173` (dev) or `http://localhost:3001` (after `npm run build` + `npm run server`)

---

## Environment variables

| Key | Required | Description |
|-----|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes (prod) | Min 32 characters; no default in production |
| `NODE_ENV` | — | `production` on Render |
| `VITE_BACKEND_URL` | For build | Full app URL (e.g. `https://unipilot.onrender.com`) for frontend API base |
| `GROQ_API_KEY` | For AI | Groq API key for AI Coach and related features |
| `FRONTEND_ORIGIN` | Optional | Comma-separated origins for CORS in production |
| `UNSPLASH_ACCESS_KEY` | Optional | For presentation slides |

See `.env.example` for a full list.

---

## Deploy (Render)

1. Connect the repo; set **Root Directory** to `frontend-vite` if needed.
2. **Build:** `npm install && npm run build`
3. **Start:** `node server/index.js`
4. In **Environment**, set: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `VITE_BACKEND_URL` (and `GROQ_API_KEY` for AI).

Details: `documentation/DEPLOY_RENDER.md`, `documentation/POSTGRES_SETUP.md`, `documentation/AI_SETUP.md`.

---

## Production & SaaS

UniPilot is set up as a production-ready SaaS (billing, usage metering, admin, observability). Key docs:

- **Launch checklist:** [docs/PRODUCTION_READINESS_CHECKLIST.md](docs/PRODUCTION_READINESS_CHECKLIST.md) — go through before launch.
- **Summary of all 14 sections:** [docs/PRODUCTION_SAAS_SUMMARY.md](docs/PRODUCTION_SAAS_SUMMARY.md)
- **Developer setup:** [docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md)
- **Deployment:** [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Security:** [docs/SECURITY.md](docs/SECURITY.md)
- **Observability:** [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)

Billing (Stripe): set `STRIPE_*` env vars and configure webhook to `/api/billing/webhook`. Plans: Free (limited AI), Pro, Student. **Full setup guide (Arabic):** [docs/STRIPE_SETUP_AR.md](docs/STRIPE_SETUP_AR.md).

**نشر على Render (دليل كامل بالعربية):** [docs/RENDER_DEPLOY_AR.md](docs/RENDER_DEPLOY_AR.md) — يتضمن كل المتطلبات، الدفع الإلكتروني، والذكاء الاصطناعي.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run build:analyze` | Build + bundle size report (stats.html in dist/) |
| `npm run server` | Run Express API (serves `dist/` if present) |
| `npm run seed` | Seed script |
| `npm run test` | Run Vitest tests |
| `npm run test:run` | Run tests once (CI) |
| `npm run test:unit` | Unit tests only (no DB) |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:api` | API integration tests (requires DATABASE_URL) |
| `npm run audit` | Security audit; `npm run audit:fix` for safe fixes |

---

## Security & quality

- **Auth:** JWT (7d), bcrypt passwords, auth + admin middleware
- **Security:** Helmet, rate limiting (global + auth), CORS configurable
- **Validation:** Zod on auth (register/login)
- **Privacy:** Export data and delete account in Settings; Privacy Policy and Terms of Service at `/privacy` and `/terms`

---

## Docs

جميع ملفات التوثيق المذكورة أدناه موجودة في مجلد **`documentation/`** لتسهيل النقل والمراجعة.

**Operations & deploy**
- `documentation/RUNBOOK.md` — Deploy on Render, first run, backup, troubleshooting
- `documentation/DEPLOYMENT_READINESS.md` — Deployment & sale readiness checklist
- `documentation/DEPLOY_RENDER.md` — Render deployment (Arabic/English)
- `documentation/DEPLOY_DOCKER_VPS.md` — Docker and VPS deployment
- `documentation/POSTGRES_SETUP.md` — PostgreSQL setup
- `documentation/BACKUP_RESTORE.md` — Backup and restore
- `documentation/DISASTER_RECOVERY.md` — Recovery plan

**Product & sale**
- `documentation/PREMIUM_PRODUCT_READINESS.md` — 10k+ readiness checklist (Arabic)
- `documentation/PRODUCT_SPEC.md` — Product specification
- `documentation/PRICING.md` — Pricing and payment
- `documentation/PITCH_DECK.md` — Pitch deck content
- `documentation/ONE_PAGER.md` — One-pager for PDF

**Security & legal**
- `documentation/SECURITY.md` — Security summary
- `documentation/SECURITY_UPDATES_POLICY.md` — Security updates policy
- `documentation/QUALITY_AND_COMPLIANCE.md` — Quality & ISO alignment (Arabic)
- `documentation/LEGAL_REVIEW_NOTES.md` — Legal review notes for buyer
- `documentation/SUPPORT_POLICY.md` — Support period and contact
- `documentation/SLA_TEMPLATE.md` — Optional SLA

**Admin & API**
- `documentation/ADMIN_GUIDE.md` — Admin panel guide
- `documentation/ADMIN_ACCESS.md` — Admin accounts
- `documentation/API_OVERVIEW.md` — API routes and auth
- `openapi.yaml` — OpenAPI 3.0 subset (في جذر المشروع)
- `documentation/AI_SETUP.md` — Groq AI key

**Other**
- `documentation/SEO.md` — SEO guide (meta, sitemap, robots, Google Search Console)
- `documentation/PRODUCTION_READINESS_REPORT.md` — Production checklist
- `documentation/AUDIT_NOTES.md` — npm audit notes and analysis

---

## License

MIT — see `LICENSE`.
