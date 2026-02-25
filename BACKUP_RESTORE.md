# UniPilot — Backup & Restore

How to back up and restore the PostgreSQL database used by UniPilot.

---

## 1. Backup

### Option A: Render PostgreSQL

- **Dashboard:** Render → Your PostgreSQL service → **Info** tab.
- **Backups:** On paid plans, Render can create automated backups. Use the Backup option in the dashboard and download when needed.
- **Manual dump (any plan):** From a machine that can reach the DB (or from a one-off job):

  ```bash
  pg_dump "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -Fc -f unipilot_backup_$(date +%Y%m%d).dump
  ```

  Use the same URL as `DATABASE_URL` (with `?sslmode=require` for Render). `-Fc` produces a custom-format dump suitable for restore.

### Option B: Neon / Supabase / Other

- Use the provider’s backup or snapshot feature.
- Or run `pg_dump` as above with the provider’s connection string (and their required SSL/options).

### Recommendation

- Run backups regularly (e.g. daily). Retain at least 7–30 days depending on policy.
- Store backups in a separate location (e.g. S3, local NAS), not only on the same host as the app.

---

## 2. Restore

### From a custom-format dump (`-Fc`)

```bash
pg_restore -d "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" --clean --if-exists unipilot_backup_YYYYMMDD.dump
```

- `--clean --if-exists`: drop existing objects before recreating (use with care; this overwrites the target DB).
- For a **fresh** database, create an empty DB first, then run `pg_restore` without `--clean` if you prefer.

### From a plain SQL dump

If you used `pg_dump` without `-Fc` (plain SQL):

```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" -f unipilot_backup.sql
```

---

## 3. After Restore

- Restart the UniPilot application so it reconnects to the database.
- Verify with `GET /api/health` and `GET /api/ready`.
- Optionally run `npm run seed` or create an admin user again if the restored DB was from before admin accounts existed (see ADMIN_ACCESS.md).

---

## 4. Disaster Recovery

See **DISASTER_RECOVERY.md** for what to do when the server or database is lost or unavailable.
