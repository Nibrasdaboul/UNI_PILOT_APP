# UniPilot — Deploy with Docker or VPS (بدون Render)

How to run UniPilot on your own server using Docker, or on a VPS with Node and Nginx.

---

## Option A: Docker

### Prerequisites

- Docker and Docker Compose installed on the server.

### Steps

1. **Clone or copy** the project (frontend + server) to the server.
2. **Environment:** Create `.env` (or set env) with `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`, and `VITE_BACKEND_URL` pointing to your backend URL (e.g. `https://api.yourdomain.com`).
3. **Run:** From project root:
   ```bash
   docker-compose up -d
   ```
4. **First run:** Backend runs schema and migrations. Ensure PostgreSQL is reachable (see `docker-compose.yml`).
5. **Frontend:** If you serve the frontend from the same server, build it with `VITE_BACKEND_URL` set, then serve the `dist` folder with Nginx or the same Node app (static).

### Dockerfile and docker-compose

- **Dockerfile:** Builds Node app (server) and optionally serves frontend static files. See `Dockerfile` in the repo.
- **docker-compose.yml:** Defines services: `app` (UniPilot), `db` (PostgreSQL). Uses env file or environment variables. See `docker-compose.yml` in the repo.

---

## Option B: VPS (Node + Nginx + SSL)

### Prerequisites

- VPS with Node.js 18+, PostgreSQL, and Nginx installed.

### Steps

1. **Database:** Create a PostgreSQL database and user. Run `server/schema-pg.sql` and any migrations (see MIGRATIONS.md). Set `DATABASE_URL`.
2. **Backend:** Clone repo, install deps (`npm ci`), set env (`NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`). Run with `node server/index.js` or PM2: `pm2 start server/index.js --name unipilot-api`.
3. **Frontend:** In `frontend-vite`, set `VITE_BACKEND_URL=https://api.yourdomain.com`, run `npm run build`. Copy `dist/` to the server (e.g. `/var/www/unipilot`).
4. **Nginx:** Configure:
   - **API:** `api.yourdomain.com` → proxy_pass to `http://127.0.0.1:3000` (or your API port).
   - **App:** `yourdomain.com` → root `/var/www/unipilot`, try_files for SPA.
5. **SSL:** Use Let’s Encrypt (e.g. `certbot --nginx`) for both API and app domains.
6. **Health:** Ensure `GET /api/health` and `GET /api/ready` are reachable and return 200.

---

## Backup and recovery

- Back up PostgreSQL regularly (see **BACKUP_RESTORE.md**). On Docker, use `pg_dump` from the host or a sidecar. On VPS, cron `pg_dump` to a safe location.
- For full disaster recovery, see **DISASTER_RECOVERY.md**.

---

## Troubleshooting

- **502 Bad Gateway:** API not running or wrong port. Check PM2 or Docker logs.
- **CORS errors:** Ensure `VITE_BACKEND_URL` matches the URL the browser uses to call the API; backend CORS should allow that origin.
- **DB connection failed:** Check `DATABASE_URL`, firewall, and that PostgreSQL is listening and accepts connections.
