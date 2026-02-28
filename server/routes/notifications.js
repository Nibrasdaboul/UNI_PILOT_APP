import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// GET /api/notifications – list notifications for current user
notificationsRouter.get('/', async (req, res) => {
  const userId = req.user.id;
  const rows = await db
    .prepare(
      `SELECT id, title, body, type, read_at, created_at, link, source
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all(userId);
  res.json(rows);
});

// GET /api/notifications/admin – list admin-sent notifications for current user (students)
notificationsRouter.get('/admin', async (req, res) => {
  const userId = req.user.id;
  const rows = await db
    .prepare(
      `SELECT id, title, body, type, read_at, created_at
       FROM notifications
       WHERE user_id = ? AND source = 'admin'
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(userId);
  res.json(rows);
});

// POST /api/notifications/mark-read – mark a single notification as read
notificationsRouter.post('/mark-read', async (req, res) => {
  const userId = req.user.id;
  const id = parseInt(req.body?.id, 10);
  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ detail: 'id is required' });
  }
  await db.prepare(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND read_at IS NULL'
  ).run(id, userId);
  return res.status(204).send();
});

// POST /api/notifications/mark-all-read – mark all notifications as read
notificationsRouter.post('/mark-all-read', async (req, res) => {
  const userId = req.user.id;
  await db.prepare(
    'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL'
  ).run(userId);
  return res.status(204).send();
});
