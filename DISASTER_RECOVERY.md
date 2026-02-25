# UniPilot — Disaster Recovery (خطة استمرارية)

What to do when the server or database is lost or unavailable.

---

## 1. Server or App Unavailable

- **Check:** Open the app URL and `https://YOUR-APP.onrender.com/api/health`. If both fail, the service may be down or restarted.
- **Render:** Check Dashboard → Logs for crashes or out-of-memory. Restart the service if needed. On free tier, the service may spin down after inactivity; first request after that can be slow.
- **Redeploy:** If a recent deploy broke the app, trigger a deploy from a previous commit or fix the code and redeploy.

---

## 2. Database Unavailable or Lost

- **Check:** `GET /api/ready` returns 503 or "database": "disconnected". Or Render Dashboard shows PostgreSQL as failed/unreachable.
- **If the database is still running but connection fails:** Verify `DATABASE_URL` (no typo, correct host/port, SSL if required). Restart the app after fixing env.
- **If the database was deleted or corrupted:** Restore from the latest backup (see **BACKUP_RESTORE.md**). Use a new PostgreSQL instance if the old one is gone; update `DATABASE_URL` and point the app to the new DB. Then run restore.
- **After restore:** Restart the UniPilot app. Verify `/api/ready` and log in with an existing user.

---

## 3. Where Backups Are

- **You (seller):** Document where you store backups (e.g. “Backups are in [cloud bucket / NAS] and retained for X days”). Hand this over to the buyer.
- **Buyer (Render):** If they use Render PostgreSQL, they can rely on Render backups (paid) or their own `pg_dump` schedule (see BACKUP_RESTORE.md). Backups should be stored outside the same host (e.g. S3, another region).

---

## 4. Data Loss Prevention

- Run backups regularly (daily recommended). Automate via cron or provider features.
- Keep at least one backup off the same infrastructure as the live DB.
- After major changes (e.g. schema migration), test a restore once in a staging DB.

---

## 5. Contact

For critical outages, the buyer should use the support channel defined in **SUPPORT_POLICY.md**. For security incidents, refer to **SECURITY_UPDATES_POLICY.md**.
