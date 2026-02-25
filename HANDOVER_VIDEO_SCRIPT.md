# UniPilot — Handover Video Script (سكربت فيديو التسليم)

Use this script and checklist to record a short handover video for the buyer (e.g. 10–15 minutes).

---

## 1. Introduction (1 min)

- “This is the UniPilot handover. We’ll go through deployment, first login, main features, and where to find documentation.”
- Show the repo or deployment dashboard (e.g. Render) and point to **Root Directory** and **Environment** variables.

---

## 2. Deployment (2–3 min)

- Open Render (or the used platform). Show the Web Service and the PostgreSQL instance.
- Show **Environment**: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `VITE_BACKEND_URL`, `GROQ_API_KEY`.
- Explain: “First deploy runs the schema and creates tables. After deploy, we check health and readiness.”
- Open browser: `https://YOUR-APP.onrender.com/api/health` → `{"status":"ok"}`.
- Then `https://YOUR-APP.onrender.com/api/ready` → `{"status":"ready","database":"connected"}`.

---

## 3. First Login and Roles (2 min)

- Go to the app URL. Register a new user (or use a pre-created account).
- Show **Dashboard**: courses, GPA, tasks.
- “Admins get an extra menu: Admin Panel.” Show how to promote a user to admin (or use seed admin) and open **Admin Panel** and **Admin Notifications**.

---

## 4. Main Features (4–5 min)

- **Courses:** Add a course, add grades, show final grade and finalize.
- **Planner:** Add event, add task, show daily view, optionally “Generate plan” or “Suggest next.”
- **AI Coach:** Open a conversation, send a message, show response (if GROQ is configured).
- **Study tools:** Briefly show Study Tools hub and one tool (e.g. summaries or flashcards).
- **Settings:** Show profile, language (AR/EN), theme, and **Data & Privacy**: Export data, link to Privacy/Terms, Delete account.

---

## 5. Documentation (1–2 min)

- Open the repo or a shared drive. Point to:
  - **RUNBOOK.md** — deploy, env, first run, backup, troubleshooting.
  - **ADMIN_GUIDE.md** — users, catalog, notifications.
  - **ARCHITECTURE.md** — high-level design and data flow.
  - **BACKUP_RESTORE.md** — how to back up and restore the database.
  - **API_OVERVIEW.md** — main API routes and auth.
  - **SECURITY.md** — security summary for the product.

---

## 6. Support and Next Steps (1 min)

- “Support period and contact channel are in **SUPPORT_POLICY.md**. For security updates, see **SECURITY_UPDATES_POLICY.md**.”
- “If you need to deploy on your own server or Docker, see **DEPLOY_DOCKER_VPS.md**.”

---

## Checklist before recording

- [ ] App is deployed and env vars are set.
- [ ] `/api/health` and `/api/ready` return OK.
- [ ] At least one admin and one student account exist.
- [ ] GROQ key is set if you want to show AI Coach.
- [ ] Screen resolution and microphone are suitable for the viewer.
