/**
 * PostgreSQL database layer for UniPilot.
 * Uses connection pool; all methods are async.
 * Compatible API: db.prepare(sql).run(...params) | .get(...params) | .all(...params)
 * SQL placeholders: ? → $1, $2, ... (PostgreSQL style)
 */
import pg from 'pg';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool) {
    const connUrl = process.env.DATABASE_URL;
    if (!connUrl || connUrl.trim() === '') {
      throw new Error(
        'DATABASE_URL is required. Example: postgresql://user:password@localhost:5432/unipilot'
      );
    }
    pool = new Pool({
      connectionString: connUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/** Convert SQL with ? placeholders to $1, $2, ... and return params array. */
function toPgStyle(sql, params) {
  const out = [];
  let i = 0;
  const newSql = sql.replace(/\?/g, () => {
    i += 1;
    out.push(params[out.length]);
    return `$${i}`;
  });
  return { sql: newSql, params: out };
}

/**
 * Prepare a statement. Returns object with async run, get, all.
 * For INSERT without RETURNING, we append " RETURNING id" to get lastInsertRowid.
 */
function prepare(sql) {
  const sqlTrim = sql.trim();
  const isInsert = sqlTrim.toUpperCase().startsWith('INSERT');
  const hasReturning = /RETURNING\s+/i.test(sqlTrim);

  return {
    async run(...params) {
      const client = getPool();
      let q = sql;
      if (isInsert && !hasReturning) {
        q = sqlTrim.endsWith(';') ? sqlTrim.slice(0, -1) + ' RETURNING id' : sqlTrim + ' RETURNING id';
      }
      const { sql: pgSql, params: pgParams } = toPgStyle(q, params);
      const res = await client.query(pgSql, pgParams);
      const rowCount = res.rowCount ?? 0;
      const lastInsertRowid = isInsert && res.rows && res.rows[0] && res.rows[0].id != null
        ? Number(res.rows[0].id)
        : 0;
      return { lastInsertRowid, changes: rowCount };
    },
    async get(...params) {
      const client = getPool();
      const { sql: pgSql, params: pgParams } = toPgStyle(sql, params);
      const res = await client.query(pgSql, pgParams);
      const row = res.rows && res.rows[0] ? res.rows[0] : undefined;
      return row;
    },
    async all(...params) {
      const client = getPool();
      const { sql: pgSql, params: pgParams } = toPgStyle(sql, params);
      const res = await client.query(pgSql, pgParams);
      return res.rows || [];
    },
  };
}

/** Run raw SQL (no params). Used for schema. */
async function exec(sql) {
  const client = getPool();
  await client.query(sql);
}

export const db = {
  prepare,
  exec,
  pragma: () => {},
  /** Direct query for complex SQL (e.g. IN clause with dynamic params). Use db.query(sql, [params]). */
  async query(sql, params = []) {
    const client = getPool();
    const { sql: pgSql, params: pgParams } = toPgStyle(sql, params);
    const res = await client.query(pgSql, pgParams);
    return res;
  },
};

/**
 * Initialize database: create schema if not exists.
 * Call once at server startup.
 */
export async function initDb() {
  const connUrl = process.env.DATABASE_URL;
  if (!connUrl || connUrl.trim() === '') {
    throw new Error(
      'DATABASE_URL is required. Set it in .env (e.g. postgresql://user:password@localhost:5432/unipilot)'
    );
  }
  getPool(); // ensure pool exists

  const schemaPath = join(__dirname, 'schema-pg.sql');
  let schema = readFileSync(schemaPath, 'utf8');
  // Remove line comments so first statement (e.g. CREATE TABLE users) is not dropped by filter
  schema = schema.replace(/^\s*--[^\n]*\n?/gm, '');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const client = getPool();
  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
    } catch (e) {
      if (e.code !== '42P07' && e.code !== '42701' && e.code !== '42P16' && !e.message?.includes('already exists')) {
        console.warn('Schema statement warning:', e.message);
      }
    }
  }
  try {
    await client.query(
      'ALTER TABLE student_courses ADD CONSTRAINT student_courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES student_semesters(id) ON DELETE SET NULL'
    );
  } catch (_) {}
  try {
    await client.query('ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ');
  } catch (e) {
    if (e.code !== '42701') throw e;
  }
  try {
    await client.query('ALTER TABLE student_semesters ADD COLUMN is_ended INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    if (e.code !== '42701') throw e;
  }
  try {
    await client.query('ALTER TABLE student_courses ADD COLUMN withdrawn INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    if (e.code !== '42701') throw e;
  }
  try {
    await client.query('ALTER TABLE users ADD COLUMN xp INTEGER NOT NULL DEFAULT 0');
  } catch (e) {
    if (e.code !== '42701') throw e;
  }
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_daily_challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        for_date DATE NOT NULL,
        challenge_key TEXT NOT NULL,
        completed_at TIMESTAMPTZ,
        xp_awarded INTEGER DEFAULT 0,
        UNIQUE(user_id, for_date)
      )
    `);
  } catch (e) {
    if (e.code !== '42P07') console.warn('user_daily_challenges:', e.message);
  }
  try {
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_daily_challenges_user_date ON user_daily_challenges(user_id, for_date)');
  } catch (_) {}
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS smart_question_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_course_id INTEGER REFERENCES student_courses(id) ON DELETE SET NULL,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    if (e.code !== '42P07') console.warn('smart_question_sessions:', e.message);
  }
  try {
    await client.query('CREATE INDEX IF NOT EXISTS idx_smart_question_sessions_user ON smart_question_sessions(user_id)');
  } catch (_) {}
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_challenge_questions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        for_date DATE NOT NULL,
        student_course_id INTEGER REFERENCES student_courses(id) ON DELETE SET NULL,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, for_date)
      )
    `);
  } catch (e) {
    if (e.code !== '42P07') console.warn('daily_challenge_questions:', e.message);
  }
  try {
    await client.query('CREATE INDEX IF NOT EXISTS idx_daily_challenge_questions_user_date ON daily_challenge_questions(user_id, for_date)');
  } catch (_) {}
  await runMigrations(client);
  console.log('PostgreSQL database initialized.');
}

/**
 * Run SQL migration files from server/migrations in order.
 * Ignores duplicate object errors (e.g. column already exists).
 */
async function runMigrations(client) {
  const { readdirSync, readFileSync } = await import('fs');
  const { join } = await import('path');
  const migrationsDir = join(__dirname, 'migrations');
  try {
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      const statements = sql
        .replace(/^\s*--[^\n]*\n?/gm, '')
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of statements) {
        try {
          await client.query(stmt + ';');
        } catch (e) {
          if (e.code !== '42P07' && e.code !== '42701' && e.code !== '42P16' && e.code !== '23505' && !e.message?.includes('already exists')) {
            console.warn('Migration', file, 'statement warning:', e.message);
          }
        }
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}
