# UniPilot — Runbook (دليل المشغّل)

Step-by-step operations guide: deploy, first run, backup, restore, and common troubleshooting.

---

## 1. Deploy on Render

1. Connect the GitHub repository. Set **Root Directory** to `frontend-vite` if the repo root is the parent folder.
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `node server/index.js`
4. **Environment variables** (Dashboard → Environment):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | PostgreSQL connection string (Render PostgreSQL or external) |
   | `JWT_SECRET` | Strong random string (min 32 characters) |
   | `VITE_BACKEND_URL` | Full app URL, e.g. `https://unipilot.onrender.com` (set before first deploy) |
   | `GROQ_API_KEY` | Groq API key (for AI features) |
   | `FRONTEND_ORIGIN` | (Optional) Comma-separated allowed origins for CORS |

5. Create a **PostgreSQL** database (Render → New → PostgreSQL), then copy the **Internal Database URL** into `DATABASE_URL`.
6. Deploy. The app runs `initDb()` on startup and creates tables if they do not exist.

---

## 2. First Run Checklist

- [ ] All env vars set (especially `DATABASE_URL`, `JWT_SECRET`, `VITE_BACKEND_URL`).
- [ ] First deploy completed successfully (build + start).
- [ ] `GET https://YOUR-APP.onrender.com/api/health` returns `{"status":"ok"}`.
- [ ] `GET https://YOUR-APP.onrender.com/api/ready` returns `{"status":"ready","database":"connected"}` (confirms DB connection).
- [ ] Open the app URL in a browser; register a user and log in.
- [ ] (Optional) Create an admin user (see ADMIN_ACCESS.md or run `node server/fix-admin.js` locally with appropriate email).

---

## 3. Backup and Restore

See **BACKUP_RESTORE.md** for how to back up PostgreSQL and restore data.

---

## 4. Common Issues

### Build fails

- Ensure **Root Directory** is `frontend-vite` (or the directory that contains `package.json` and `vite.config.js`).
- Check build logs for missing dependencies or Node version. Required Node ≥ 18.

### "Database connection" or 503 on /api/ready

- Verify `DATABASE_URL` is set and correct (no extra spaces, valid URI).
- If using Render PostgreSQL, use the **Internal** URL for the same service; for external DB, ensure the server can reach the host and port.

### "JWT_SECRET" error on startup

- Set `JWT_SECRET` in Environment (at least 32 characters). Restart the service after changing env vars.

### Frontend shows "Cannot connect" or demo mode

- Set `VITE_BACKEND_URL` to the exact app URL (e.g. `https://unipilot.onrender.com`) **before** the first build. If you add or change it later, trigger a **Redeploy** so the frontend is rebuilt with the new value.

### Rate limit (429) on login

- Default: 10 login attempts per 15 minutes per IP. Wait or use a different network; for production you can tune rate limits in code if needed.

---

## 5. Restart and Redeploy

- **Manual deploy:** Dashboard → Manual Deploy → Deploy latest commit.
- **Redeploy after env change:** Change env vars in Dashboard, then Manual Deploy (recommended for `VITE_BACKEND_URL` and any server-side secret).

---

## 6. Logs

- Render: Dashboard → Your Service → Logs. Use for startup errors, uncaught exceptions, and rate-limit or auth issues.
