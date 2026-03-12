import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

adminRouter.get('/stats', async (req, res) => {
  const total_users = (await db.prepare('SELECT COUNT(*) as c FROM users').get()).c;
  const total_students = (await db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'student'").get()).c;
  const total_courses = (await db.prepare('SELECT COUNT(*) as c FROM catalog_courses').get()).c;
  const total_tasks = 0;
  return res.json({ total_users, total_students, total_courses, total_tasks });
});

adminRouter.get('/users', async (req, res) => {
  const rows = await db.prepare('SELECT id, email, full_name, role, plan_id, created_at FROM users ORDER BY id').all();
  return res.json(rows);
});

adminRouter.patch('/users/:id/role', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const role = req.query.role;
  if (!role || !['admin', 'student'].includes(role)) {
    return res.status(400).json({ detail: 'role must be admin or student' });
  }
  const result = await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  if (result.changes === 0) return res.status(404).json({ detail: 'User not found' });
  const user = await db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(id);
  return res.json(user);
});

adminRouter.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const result = await db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ detail: 'User not found' });
  return res.status(204).send();
});

// GET /api/admin/notification-broadcasts – list broadcasts sent by current admin
adminRouter.get('/notification-broadcasts', async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT id, title, body, type, created_at
       FROM notification_broadcasts
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(req.user.id);
  return res.json(rows);
});

// POST /api/admin/notifications – send notification to all students
adminRouter.post('/notifications', async (req, res) => {
  const title = (req.body?.title || '').trim();
  const body = (req.body?.body || '').trim();
  const type = (req.body?.type || 'info').trim();
  if (!title || !body) {
    return res.status(400).json({ detail: 'title and body are required' });
  }
  const allowedTypes = ['info', 'warning', 'success'];
  const t = allowedTypes.includes(type) ? type : 'info';
  const students = await db.prepare("SELECT id FROM users WHERE role = 'student'").all();
  if (!students.length) {
    return res.status(400).json({ detail: 'No students found to notify' });
  }
  const link = '/admin-notifications';
  try {
    await db.prepare(
      'INSERT INTO notification_broadcasts (user_id, title, body, type) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, title, body, t);
  } catch (e) {
    return res.status(500).json({ detail: 'Failed to log broadcast' });
  }
  const stmt = db.prepare(
    'INSERT INTO notifications (user_id, title, body, type, link, source) VALUES (?, ?, ?, ?, ?, ?)'
  );
  let created = 0;
  for (const s of students) {
    try {
      await stmt.run(s.id, title, body, t, link, 'admin');
      created += 1;
    } catch (e) {
      // إذا فشل إدخال طالب واحد لا نوقف الباقي
    }
  }
  return res.status(201).json({ created });
});

// GET /api/admin/usage — usage stats (AI requests, by plan)
adminRouter.get('/usage', async (req, res) => {
  try {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    const startStr = periodStart.toISOString().slice(0, 10);
    const usageRows = await db.prepare(`
      SELECT u.user_id, u.ai_requests_count, u.ai_tokens_approx, u.summaries_count, u.flashcards_count, u.quizzes_count
      FROM usage_tracking u
      WHERE u.period_start = ?
    `).all(startStr);
    const planCounts = await db.prepare(
      'SELECT plan_id, COUNT(*) as c FROM users GROUP BY plan_id'
    ).all();
    const aiTotal = await db.prepare(`
      SELECT COUNT(*) as c FROM ai_requests WHERE created_at >= ?
    `).get(periodStart.toISOString());
    return res.json({
      period_start: startStr,
      total_ai_requests: aiTotal?.c ?? 0,
      usage_by_user: usageRows,
      users_by_plan: planCounts,
    });
  } catch (e) {
    return res.status(500).json({ detail: 'Failed to load usage' });
  }
});

// GET /api/admin/ai-costs — recent AI request counts (for cost monitoring)
adminRouter.get('/ai-costs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const rows = await db.prepare(`
      SELECT id, user_id, feature, model, tokens_approx, created_at
      FROM ai_requests
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);
    const summary = await db.prepare(`
      SELECT feature, COUNT(*) as c, COALESCE(SUM(tokens_approx), 0) as tokens
      FROM ai_requests
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY feature
    `).all();
    return res.json({ recent: rows, last_7_days_by_feature: summary });
  } catch (e) {
    return res.status(500).json({ detail: 'Failed to load AI costs' });
  }
});

// PATCH /api/admin/users/:id/subscription — set plan (e.g. grant pro for testing)
adminRouter.patch('/users/:id/subscription', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { plan_id } = req.body || {};
  if (!plan_id || !['free', 'pro', 'student'].includes(plan_id)) {
    return res.status(400).json({ detail: 'plan_id must be free, pro, or student' });
  }
  const result = await db.prepare('UPDATE users SET plan_id = ? WHERE id = ?').run(plan_id, id);
  if (result.changes === 0) return res.status(404).json({ detail: 'User not found' });
  const user = await db.prepare('SELECT id, email, plan_id FROM users WHERE id = ?').get(id);
  return res.json(user);
});
