# UniPilot — Admin Guide (دليل المسؤول)

How to manage users, catalog, and notifications as an administrator.

---

## 1. Accessing the Admin Panel

- **URL:** After login, go to **Admin Panel** from the sidebar (or `/admin`). Only users with role `admin` can access.
- **Default admin accounts** (if seeded): `admin@unipilot.local` / `Admin123!`, `adm@unipilot.local` / `Admin123!`. Change these passwords in production or create new admins and remove defaults.

---

## 2. Managing Users

- **List users:** Admin Panel shows a list of all users (students and admins).
- **Change role:** You can change a user’s role (e.g. promote to admin or demote to student) via the controls in the list.
- **Delete user:** Deleting a user removes their account and all associated data (courses, planner, notes, etc.). Use with care.

---

## 3. Course Catalog

- The **catalog** is the list of courses that admins can create and edit. Students add courses from this catalog to their own “My courses”.
- **Add course:** Create a new catalog course (course code, name, department, description, credit hours, optional prerequisite).
- **Edit / delete:** Edit or remove catalog courses. Deleting a catalog course may affect students who have already added it; the app handles references according to the schema (e.g. optional reference from student_courses).

---

## 4. Notifications (Broadcasts)

- **Admin Notifications:** From the sidebar go to **Admin Notifications** (or `/admin/notifications`).
- **Send broadcast:** Create a notification that is sent to all users (or target group if the UI supports it). Set title, body, type (e.g. info / warning / success), and optional link.
- Students see these in their **Notifications** and in the **Admin Notifications** area.

---

## 5. Statistics

- The Admin Panel can show basic stats (e.g. total users, total courses, total tasks). Use these to monitor usage.

---

## 6. Best Practices

- Use strong passwords for admin accounts and avoid sharing admin credentials.
- Prefer creating dedicated admin users instead of using the default seed accounts in production.
- For audits: use **Export data** (per user) and database backups (see BACKUP_RESTORE.md) to retain evidence of data and changes.

For first-time setup of an admin user (e.g. promote an existing account), see **ADMIN_ACCESS.md** or run `node server/fix-admin.js` with the appropriate email (e.g. in local `.env` with `DATABASE_URL`).
