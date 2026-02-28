# UniPilot — Deployment & Sale Readiness (جاهزية النشر والبيع)

Short checklist to confirm the project is complete and ready for deployment or sale.

---

## 1. Deploy readiness

- [ ] **Environment:** `DATABASE_URL`, `JWT_SECRET` (min 32 chars), `VITE_BACKEND_URL` set (Render Dashboard or `.env`).
- [ ] **Build:** `npm run build` succeeds; no errors in build log.
- [ ] **Health:** `GET /api/health` → `{"status":"ok"}`.
- [ ] **Readiness:** `GET /api/ready` → `{"status":"ready","database":"connected"}`.
- [ ] **App:** Open app URL; register, login, and use dashboard.
- [ ] **Admin:** At least one admin user (see `ADMIN_ACCESS.md` or `node server/fix-admin.js`).
- [ ] **AI (optional):** `GROQ_API_KEY` set if AI Coach is required.

**Render:** Use `render.yaml` (root or inside `frontend-vite`). Blueprint includes PostgreSQL; set `JWT_SECRET`, `VITE_BACKEND_URL`, `GROQ_API_KEY` in Dashboard.

---

## 2. Sale readiness (10k+)

- [ ] **Docs:** RUNBOOK, ADMIN_GUIDE, SECURITY, BACKUP_RESTORE, DISASTER_RECOVERY, PRODUCT_SPEC, PRICING, PITCH_DECK, SUPPORT_POLICY, LICENSE_AGREEMENT_TEMPLATE, INVOICE_TEMPLATE (see README).
- [ ] **Code:** Code splitting, `/api/ready`, terms acceptance (`terms_accepted_at`), Sentry optional (`VITE_SENTRY_DSN`).
- [ ] **Tests:** Unit (Vitest), E2E (Playwright), API (supertest); `npm run test:run`, `npm run test:e2e`, `npm run test:api`.
- [ ] **Audit:** `npm run audit`; see `AUDIT_NOTES.md` for known exceptions.
- [ ] **Branding:** Logo (`public/logo.svg`), favicon, manifest, `/pricing` page.
- [ ] **Docker:** `Dockerfile` + `docker-compose.yml` for self-hosted (see DEPLOY_DOCKER_VPS.md).

Full list: **PREMIUM_PRODUCT_READINESS.md**.

---

## 3. Before first production deploy

1. Set all required env vars (no defaults for `JWT_SECRET` in production).
2. Use a dedicated PostgreSQL instance (Render, Neon, or self-hosted).
3. Set `VITE_BACKEND_URL` **before** first build (or redeploy after changing it).
4. Run `npm run build` (or let Render run it); start with `node server/index.js`.

---

## 4. Handover

- **Runbook:** RUNBOOK.md.
- **Handover video:** HANDOVER_VIDEO_SCRIPT.md.
- **Support:** SUPPORT_POLICY.md, SECURITY_UPDATES_POLICY.md.

---

**Summary:** If all items in sections 1 and 2 are checked, the project is complete and ready for deployment or sale. For detailed requirements, see PREMIUM_PRODUCT_READINESS.md and RUNBOOK.md.
