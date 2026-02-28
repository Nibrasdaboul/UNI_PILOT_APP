# UniPilot API Overview

Base path: `/api`. All protected routes require header: `Authorization: Bearer <token>`.

---

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check → `{ "status": "ok" }` |
| GET | `/api/ready` | Readiness: checks DB → `{ "status": "ready", "database": "connected" }` or 503 |

---

## Auth (no auth header; rate-limited)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Body: `email`, `password`, `full_name` (optional). Returns `access_token`, `user`. |
| POST | `/api/auth/login` | Body: `email`, `password`. Returns `access_token`, `user`. |
| GET | `/api/auth/me` | **Auth.** Current user. |
| PATCH | `/api/auth/settings` | **Auth.** Body: `full_name`. Update profile. |
| GET | `/api/auth/export` | **Auth.** Export user data as JSON. |
| DELETE | `/api/auth/account` | **Auth.** Delete account and all data. |

---

## Catalog (admin for write)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog/courses` | — | List catalog courses |
| POST | `/api/catalog/courses` | Admin | Create catalog course |
| PATCH/DELETE | `/api/catalog/courses/:id` | Admin | Update/delete catalog course |

---

## Student

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/DELETE | `/api/student/courses` | **Auth.** List, add, remove student courses |
| GET/POST/PATCH/DELETE | `/api/student/semesters` | **Auth.** Semesters CRUD |

---

## Dashboard & courses

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/summary` | **Auth.** Dashboard data (courses, GPA, tasks, etc.) |
| GET | `/api/courses/:courseId` | **Auth.** Course details |
| GET | `/api/courses/:courseId/resources` | **Auth.** Course resources |
| POST | `/api/courses/:courseId/finalize` | **Auth.** Mark course as finalized |
| GET/POST | `/api/courses/:courseId/modules` | **Auth.** Modules CRUD |
| PATCH/DELETE | `/api/courses/:courseId/modules/:moduleId` | **Auth.** Module update/delete |
| GET/POST/PATCH/DELETE | `/api/courses/:courseId/modules/:moduleId/items` | **Auth.** Module items CRUD |
| GET/POST | `/api/courses/:courseId/grades` | **Auth.** Grade items |
| PATCH/DELETE | `/api/grades/:id` | **Auth.** Update/delete grade item |

---

## Planner

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/planner/daily` | **Auth.** Query: `date`. Events + tasks for date |
| GET/POST/PATCH/DELETE | `/api/planner/events` | **Auth.** Events CRUD |
| GET/POST/PATCH/DELETE | `/api/planner/tasks` | **Auth.** Tasks CRUD |
| POST | `/api/planner/generate-plan` | **Auth.** AI-generated plan |
| POST | `/api/planner/suggest-next` | **Auth.** Suggest next task |
| GET | `/api/planner/compare` | **Auth.** Compare app vs student plan |
| GET | `/api/planner/feedback` | **Auth.** Daily feedback |

---

## AI

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/ai/conversations` | **Auth.** List/create conversations |
| GET/PATCH/DELETE | `/api/ai/conversations/:id` | **Auth.** Conversation + messages |
| POST | `/api/ai/chat` | **Auth.** Send message, get AI reply |
| POST | `/api/ai/summarize` | **Auth.** Summarize text |
| POST | `/api/ai/generate_flashcards` | **Auth.** Generate flashcards |
| POST | `/api/ai/generate_quiz` | **Auth.** Generate quiz |
| … | … | See `server/routes/ai.js` for full list |

---

## Study, voice, TTS, theses, diagrams, notifications

- **Study:** `/api/study/*` — documents, summaries, flashcards, quiz, mind map
- **Voice:** `/api/voice/*` — sessions, upload, summarize
- **TTS:** `/api/tts/*` — speak, extract, tashkeel
- **Theses:** `/api/theses/*` — sources, help
- **Diagrams:** `/api/diagrams/*` — from-content, custom, infographic
- **Notifications:** `/api/notifications/*` — list, mark read; admin broadcasts

All require **Auth**; some endpoints require **Admin** (e.g. notifications admin list).

---

## Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | **Admin.** Stats (users, courses, etc.) |
| GET/PATCH/DELETE | `/api/admin/users` | **Admin.** List, update role, delete user |

---

## Error responses

- `401` — Missing or invalid token / user not found
- `403` — Admin only
- `400` — Validation error (body: `{ "detail": "message" }`)
- `404` — Not found
- `429` — Rate limit (body: `{ "detail": "Too many requests..." }`)
- `500` — Server error (body: `{ "detail": "..." }` in production generic message)
