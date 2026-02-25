# UniPilot — Database Migrations

UniPilot applies the full schema on startup (`server/schema-pg.sql`) and then runs optional migration steps for existing databases (e.g. adding columns added in later versions).

---

## How migrations work today

1. **First run:** `initDb()` runs all statements in `schema-pg.sql`. Tables are created with `CREATE TABLE IF NOT EXISTS`.
2. **Post-schema steps:** After the schema file, the code runs additional SQL (e.g. `ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ`) inside try/catch. If the column already exists (PostgreSQL error `42701`), the error is ignored.

---

## Record of migration steps

Document any manual or one-off migration here so operators and buyers can reproduce them.

| Date / Version | Change | SQL / Notes |
|----------------|--------|-------------|
| 2025-02 | Add `terms_accepted_at` to `users` | `ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;` (or run via initDb; duplicate column is ignored). |

---

## Adding a new migration

1. **Schema file:** For **new** installations, add the new column/table to `server/schema-pg.sql` so new deploys get it.
2. **Existing DBs:** In `server/db.js` inside `initDb()`, after the schema loop, add a `try/catch` block that runs the `ALTER` (or equivalent). If the change already exists (e.g. duplicate column), catch the error and ignore it (e.g. code `42701`).
3. **Document:** Add a row to the table above with date, change description, and the SQL.

---

## Manual migration (optional)

If you prefer to run migrations manually instead of via initDb:

1. Connect to the database (e.g. `psql` or a GUI).
2. Run the SQL for the migration.
3. Deploy the new code that expects the new schema.

This document should still be updated with the same SQL for future reference.
