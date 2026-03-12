# UniPilot — Product Specification (مواصفات المنتج)

Formal list of features, roles, and known limits for the UniPilot product.

---

## 1. Product Name and Purpose

- **Name:** UniPilot  
- **Tagline:** Your Smart Academic Companion / رفيقك الجامعي المتكامل  
- **Purpose:** All-in-one academic companion for students: dashboard, courses, grades, planner, AI coach, study tools, notes, and admin management for institutions.

---

## 2. Roles

| Role | Capabilities |
|------|---------------|
| **Student** | Register, log in, manage profile; add courses (from catalog or custom); enter grades; use planner (events/tasks); use AI coach; use study tools (summaries, flashcards, quiz, mind map); voice-to-text and TTS; notes; view notifications; export data; delete account. |
| **Admin** | Everything a student can do; plus: manage users (list, change role, delete); manage course catalog (CRUD); send broadcast notifications; view basic stats. |

---

## 3. Feature List

- **Authentication:** Registration, login, JWT, password hashing (bcrypt), optional terms/privacy acceptance at signup.
- **Dashboard:** Summary of courses, GPA, credits, tasks; links to main sections.
- **Courses:** Catalog (admin); student courses with grades, modules, resources; finalize course and credit calculation.
- **Academic history:** Semesters, GPA, credits completed/carried; AI suggestions for next semester.
- **Planner:** Events and tasks; daily view; AI-generated plan; suggest next task; compare app vs student plan; feedback.
- **AI Coach:** Chat with context (courses, grades, tasks); conversations history; course-specific chat.
- **Study tools:** Document upload; summaries; flashcards; quiz; mind map.
- **Voice:** Sessions; upload audio; summarize.
- **TTS:** Speak text; extract text; tashkeel.
- **Theses / research:** Help and sources for research/theses.
- **Diagrams / infographics:** From content; custom; infographic; research.
- **Notes:** Student and app notes; improve note (AI).
- **Notifications:** Per-user notifications; admin broadcasts.
- **Settings:** Profile (name); language (AR/EN); theme (light/dark); data export; account deletion.
- **Legal:** Privacy Policy and Terms of Service pages; cookie consent; terms acceptance stored at registration.

---

## 4. Supported Languages and UX

- **UI languages:** Arabic, English (toggle in settings).
- **Theme:** Light / dark.
- **Layout:** Responsive (desktop and mobile). RTL support for Arabic.

---

## 5. Known Limits (للجامعات والمؤسسات)

- **Users:** Tested for thousands of users (e.g. 2000–3000 students, hundreds of admins). Exact limits depend on hosting (e.g. Render plan) and database performance.
- **AI:** Depends on third-party API (e.g. Groq). Subject to provider’s rate limits and availability.
- **Storage:** User-uploaded content (documents, audio) and generated content stored in PostgreSQL; large deployments may require storage and backup planning.
- **Browsers:** Modern browsers (Chrome, Firefox, Safari, Edge). No support for legacy IE.

---

## 6. Out of Scope (Current Version)

- Native mobile app (current product is web app).
- SSO/LDAP (login is email + password only).
- Multi-tenancy (single instance, single database; tenants could be separated by separate deployments per institution).
- Offline mode or full PWA with offline data sync.

---

**Document version:** 1.0  
**Last updated:** February 2025
