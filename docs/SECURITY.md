# UniPilot — Security

## Overview

This document summarizes security measures and best practices for the UniPilot SaaS application.

## Authentication

- **JWT:** Access tokens signed with `JWT_SECRET` (min 32 characters in production). Stored client-side (e.g. sessionStorage); sent as `Authorization: Bearer <token>`.
- **No default secret:** In `NODE_ENV=production`, the server refuses to start without a strong `JWT_SECRET`.
- **Token expiry:** Configurable via `JWT_EXPIRES_IN` (default 7d). Shorten for high-security environments.
- **Refresh tokens:** Not implemented; tokens are long-lived. For stricter security, implement refresh tokens (short-lived access + httpOnly cookie or separate endpoint) and token rotation.

## HTTPS and headers

- **HTTPS:** Enforced by the deployment platform (Render, AWS, etc.). Application listens on HTTP behind a TLS-terminating proxy.
- **Helmet:** Security headers (X-Content-Type-Options, X-Frame-Options, etc.). Content-Security-Policy enabled in production.
- **CORS:** In production, restrict to `FRONTEND_ORIGIN` (comma-separated). In development, all origins allowed for ease of use.

## Rate limiting

- **Global:** Configurable per-window limit (e.g. 2400 req/15 min per IP) to reduce abuse.
- **Auth:** Stricter limit on `/api/auth` (e.g. 50/15 min per IP) to mitigate brute-force.
- **AI:** Quota enforced per user per month (free tier); 402 when exceeded. Optional per-route rate limits for expensive AI endpoints.

## Input validation and injection

- **Validation:** Zod schemas on auth (register, login). Extend to other critical request bodies.
- **SQL:** All queries use parameterized statements (`?` → `$1,$2,...`). No raw string concatenation for user input.
- **XSS:** React escapes by default. Avoid `dangerouslySetInnerHTML` with user content; sanitize if required.
- **Length limits:** Enforce max lengths on text fields in schemas and DB where applicable.

## CSRF

- **Current:** API is Bearer-only (no cookie-based session auth). CSRF risk is low for same-origin or correctly configured CORS.
- **If adding cookie auth later:** Use SameSite cookies and/or CSRF tokens for state-changing requests; validate origin/referer.

## Secrets management

- **No secrets in code:** All secrets (JWT_SECRET, DATABASE_URL, Stripe keys, etc.) from environment variables.
- **Production:** Set secrets in the host’s env (e.g. Render Dashboard, AWS Secrets Manager). Rotate periodically.
- **Stripe webhook:** Verify signature using `STRIPE_WEBHOOK_SECRET`; reject invalid payloads with 400.

## Data and privacy

- **Passwords:** Bcrypt hashed only; never logged or returned.
- **Export/delete:** User can export their data and delete account via `/api/auth/export` and `DELETE /api/auth/account` (GDPR-style).

## Dependency and operations

- **Audit:** Run `npm audit` and address critical/high issues.
- **Updates:** Keep dependencies updated; monitor advisories for Express, pg, Stripe, etc.
- **Error tracking:** Sentry (or similar) in production; avoid logging sensitive data (passwords, tokens, PII) in stack traces.

## Security checklist (production)

- [ ] `JWT_SECRET` set and ≥ 32 characters  
- [ ] `DATABASE_URL` not exposed to client  
- [ ] `FRONTEND_ORIGIN` set and correct  
- [ ] HTTPS only  
- [ ] Stripe webhook signature verified  
- [ ] No default or demo admin passwords in production  
- [ ] Rate limits and AI quotas enabled  
- [ ] Error tracking (e.g. Sentry) configured without leaking secrets  
