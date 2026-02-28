# UniPilot — Security Summary

This document summarizes the security measures implemented in UniPilot for production and commercial deployment.

## Authentication

- **Passwords:** Hashed with bcrypt (cost factor 10). Never stored in plain text.
- **Sessions:** JWT (JSON Web Tokens) with configurable secret (`JWT_SECRET`). Token expiry: 7 days. No session cookies; authorization via `Authorization: Bearer <token>` header.
- **Production requirement:** `JWT_SECRET` must be set in production and at least 32 characters; server fails to start if missing.

## Request Protection

- **Rate limiting:**
  - Global: 300 requests per 15 minutes per IP.
  - Auth routes (login/register): 10 attempts per 15 minutes per IP (brute-force protection).
- **CORS:** Configurable via `FRONTEND_ORIGIN` in production (comma-separated list). Default allows same-origin only when variable is not set.
- **Security headers (Helmet):** X-Content-Type-Options, X-Frame-Options, and other OWASP-recommended headers. Content-Security-Policy enabled in production only.

## Input Validation

- **Auth:** Registration and login validated with Zod (email format, password length min 8, optional full name). Invalid input returns 400 with a clear message.
- **SQL:** All database access uses parameterized queries (`?` → `$1, $2` in PostgreSQL). No raw user input concatenated into SQL.

## Data Protection

- **Export:** Users can export their data (Settings → Export my data). API: `GET /api/auth/export` (JSON download).
- **Deletion:** Users can delete their account (Settings → Delete my account). API: `DELETE /api/auth/account`. All associated data is removed (GDPR-style right to erasure).
- **Terms acceptance:** On registration, the user’s acceptance of Terms of Service and Privacy Policy is recorded (`terms_accepted_at` in database).

## Infrastructure

- **HTTPS:** Enforced by the hosting platform (e.g. Render). No sensitive data sent over plain HTTP.
- **Secrets:** No secrets in source code. All sensitive configuration via environment variables (e.g. `DATABASE_URL`, `JWT_SECRET`, `GROQ_API_KEY`). `.env` is gitignored.

## Error Handling

- **API:** Uncaught errors are handled by a global Express error middleware. In production, responses return a generic message; details are logged server-side only.

## Recommendations for Buyers

- Run `npm audit` periodically and address critical/moderate vulnerabilities.
- Use a dedicated PostgreSQL instance with backups (see BACKUP_RESTORE.md).
- For high-traffic or multi-region deployments, consider a shared store (e.g. Redis) for rate limiting and, if needed, session storage.
