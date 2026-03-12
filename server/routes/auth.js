import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authMiddleware, signToken } from '../middleware/auth.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validate.js';
import { track, events } from '../lib/analytics.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const { email, password, full_name } = req.validated;
  const emailNorm = String(email).toLowerCase().trim();
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
  if (existing) {
    return res.status(400).json({ detail: 'Email already registered' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = await db.prepare(
    'INSERT INTO users (email, password_hash, full_name, role, terms_accepted_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
  ).run(emailNorm, hash, (full_name || emailNorm.split('@')[0] || 'User').slice(0, 200), 'student');
  const user = await db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  const access_token = signToken(user.id);
  track(events.signup, { email: user.email }, user.id).catch(() => {});
  return res.status(201).json({ access_token, user });
});

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.validated;
  const emailNorm = String(email).toLowerCase().trim();
  const row = await db.prepare('SELECT id, email, full_name, role, password_hash FROM users WHERE email = ?').get(emailNorm);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }
  const user = { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
  const access_token = signToken(row.id);
  track(events.login, { email: user.email }, user.id).catch(() => {});
  return res.json({ access_token, user });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  return res.json(req.user);
});

// Delete own account and all associated data (GDPR-style right to erasure)
authRouter.delete('/account', authMiddleware, async (req, res) => {
  const userId = Number(req.user.id);
  try {
    await db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM notification_broadcasts WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM voice_sessions WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM study_quiz_attempts WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM study_quizzes WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM study_mind_maps WHERE user_id = ?').run(userId);
    const setIds = await db.prepare('SELECT id FROM study_flashcard_sets WHERE user_id = ?').all(userId);
    for (const s of setIds) await db.prepare('DELETE FROM study_flashcards WHERE set_id = ?').run(s.id);
    await db.prepare('DELETE FROM study_flashcard_sets WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM study_summaries WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM study_documents WHERE user_id = ?').run(userId);
    const sessions = await db.prepare('SELECT id FROM ai_chat_sessions WHERE user_id = ?').all(userId);
    for (const s of sessions) {
      await db.prepare('DELETE FROM ai_chat_messages WHERE session_id = ?').run(s.id);
    }
    await db.prepare('DELETE FROM ai_chat_sessions WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM course_chat_messages WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM planner_tasks WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM planner_events WHERE user_id = ?').run(userId);
    const courses = await db.prepare('SELECT id FROM student_courses WHERE user_id = ?').all(userId);
    for (const c of courses) {
      await db.prepare('DELETE FROM grade_items WHERE student_course_id = ?').run(c.id);
      const mods = await db.prepare('SELECT id FROM course_modules WHERE student_course_id = ?').all(c.id);
      for (const m of mods) {
        await db.prepare('DELETE FROM course_module_items WHERE course_module_id = ?').run(m.id);
      }
      await db.prepare('DELETE FROM course_modules WHERE student_course_id = ?').run(c.id);
    }
    await db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM student_semesters WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM student_academic_record WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM student_courses WHERE user_id = ?').run(userId);
    await db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  } catch (e) {
    console.error('Delete account error:', e);
    return res.status(500).json({ detail: 'Failed to delete account' });
  }
  return res.status(204).send();
});

// Export user data (GDPR-style data portability)
authRouter.get('/export', authMiddleware, async (req, res) => {
  const userId = Number(req.user.id);
  try {
    const [user, courses, semesters, record, notes, events, tasks] = await Promise.all([
      db.prepare('SELECT id, email, full_name, role, created_at FROM users WHERE id = ?').get(userId),
      db.prepare('SELECT * FROM student_courses WHERE user_id = ?').all(userId),
      db.prepare('SELECT * FROM student_semesters WHERE user_id = ?').all(userId),
      db.prepare('SELECT * FROM student_academic_record WHERE user_id = ?').get(userId),
      db.prepare('SELECT id, student_course_id, content, type, created_at FROM notes WHERE user_id = ?').all(userId),
      db.prepare('SELECT id, student_course_id, title, start_date, end_date, event_type, completed FROM planner_events WHERE user_id = ?').all(userId),
      db.prepare('SELECT id, student_course_id, title, due_date, priority, completed FROM planner_tasks WHERE user_id = ?').all(userId),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      user,
      courses,
      semesters,
      academic_record: record,
      notes,
      planner_events: events,
      planner_tasks: tasks,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="unipilot-data-export.json"');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (e) {
    console.error('Export error:', e);
    return res.status(500).json({ detail: 'Export failed' });
  }
});
