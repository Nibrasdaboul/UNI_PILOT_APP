import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { computeSemesterGpa, markToLetter, markToGpaPoints } from '../lib/gradeUtils.js';

export const semestersRouter = Router();
semestersRouter.use(authMiddleware);

// List user's semesters (ordered)
semestersRouter.get('/', async (req, res) => {
  const rows = await db.prepare(`
    SELECT id, user_id, name, sort_order, is_current, is_ended, app_rating, created_at
    FROM student_semesters WHERE user_id = ? ORDER BY sort_order ASC, id ASC
  `).all(req.user.id);
  return res.json(rows);
});

// Get current semester
semestersRouter.get('/current', async (req, res) => {
  const row = await db.prepare(`
    SELECT id, user_id, name, sort_order, is_current, is_ended, app_rating, created_at
    FROM student_semesters WHERE user_id = ? AND is_current = 1 LIMIT 1
  `).get(req.user.id);
  return res.json(row || null);
});

// Create semester
semestersRouter.post('/', async (req, res) => {
  const body = req.body || {};
  let name = (body.name || '').trim();
  const yearNumber = body.year_number != null ? parseInt(body.year_number, 10) : null;
  const semesterNumber = body.semester_number != null ? parseInt(body.semester_number, 10) : null;
  if (yearNumber != null && semesterNumber != null && yearNumber >= 1 && yearNumber <= 5 && (semesterNumber === 1 || semesterNumber === 2)) {
    name = name || `Year ${yearNumber} - Semester ${semesterNumber}`;
  }
  if (!name) name = 'فصل جديد';
  const isCurrent = body.is_current ? 1 : 0;
  const appRating = body.app_rating != null ? String(body.app_rating).trim() || null : null;
  let sortOrder;
  if (yearNumber != null && semesterNumber != null && yearNumber >= 1 && yearNumber <= 5 && (semesterNumber === 1 || semesterNumber === 2)) {
    sortOrder = (yearNumber - 1) * 2 + semesterNumber;
  } else {
    const maxOrder = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM student_semesters WHERE user_id = ?').get(req.user.id);
    sortOrder = (maxOrder?.m ?? 0) + 1;
  }
  if (isCurrent === 1) {
    await db.prepare('UPDATE student_semesters SET is_current = 0 WHERE user_id = ?').run(req.user.id);
  }
  const r = await db.prepare(`
    INSERT INTO student_semesters (user_id, name, sort_order, is_current, app_rating)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, name, sortOrder, isCurrent, appRating);
  const row = await db.prepare('SELECT * FROM student_semesters WHERE id = ?').get(r.lastInsertRowid);
  return res.status(201).json(row);
});

// Get one semester with full summary (courses, grades, letter, gpa, hours)
semestersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sem = await db.prepare('SELECT * FROM student_semesters WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!sem) return res.status(404).json({ detail: 'Semester not found' });

  const courses = await db.prepare(`
    SELECT id, course_name, course_code, credit_hours, current_grade, finalized_at, passed, withdrawn
    FROM student_courses WHERE semester_id = ? AND user_id = ? AND (withdrawn IS NULL OR withdrawn = 0)
  `).all(id, req.user.id);

  const withLetterAndGpa = courses.map((c) => {
    const grade = c.current_grade != null ? Number(c.current_grade) : null;
    return {
      ...c,
      letter_grade: grade != null ? markToLetter(grade) : null,
      gpa_points: grade != null ? markToGpaPoints(grade) : null,
    };
  });

  const hoursRegistered = courses.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const hoursCompleted = courses.filter((c) => c.finalized_at != null && c.passed === 1).reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const hoursCarried = courses.filter((c) => c.finalized_at != null && c.passed === 0).reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const coursesWithMark = withLetterAndGpa.map((c) => ({ ...c, final_mark: c.current_grade }));
  const semester_gpa = computeSemesterGpa(coursesWithMark);

  const withGrade = courses.filter((c) => c.current_grade != null && c.finalized_at != null);
  function computedAppRating(gpa, hasGraded) {
    if (!hasGraded || gpa == null) return null;
    const g = Number(gpa);
    if (g >= 3.5) return 'excellent';
    if (g >= 2.75) return 'good';
    if (g >= 2) return 'acceptable';
    return 'poor';
  }
  const app_rating_computed = computedAppRating(semester_gpa, withGrade.length > 0);

  return res.json({
    ...sem,
    courses: withLetterAndGpa,
    hours_registered: hoursRegistered,
    hours_completed: hoursCompleted,
    hours_carried: hoursCarried,
    semester_gpa,
    app_rating_computed,
  });
});

// Update semester (name, is_current, app_rating, sort_order)
semestersRouter.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sem = await db.prepare('SELECT id FROM student_semesters WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!sem) return res.status(404).json({ detail: 'Semester not found' });

  const body = req.body || {};
  if (body.name != null) {
    const name = (body.name || '').trim() || 'فصل';
    await db.prepare('UPDATE student_semesters SET name = ? WHERE id = ?').run(name, id);
  }
  if (body.app_rating !== undefined) {
    const v = body.app_rating == null ? null : String(body.app_rating).trim() || null;
    await db.prepare('UPDATE student_semesters SET app_rating = ? WHERE id = ?').run(v, id);
  }
  if (body.sort_order != null) {
    await db.prepare('UPDATE student_semesters SET sort_order = ? WHERE id = ?').run(Number(body.sort_order), id);
  }
  if (body.is_current === true || body.is_current === 1) {
    await db.prepare('UPDATE student_semesters SET is_current = 0 WHERE user_id = ?').run(req.user.id);
    await db.prepare('UPDATE student_semesters SET is_current = 1 WHERE id = ?').run(id);
  }
  if (body.is_ended === true || body.is_ended === 1) {
    await db.prepare('UPDATE student_semesters SET is_ended = 1 WHERE id = ?').run(id);
  }
  if (body.is_ended === false || body.is_ended === 0) {
    await db.prepare('UPDATE student_semesters SET is_ended = 0 WHERE id = ?').run(id);
  }

  const row = await db.prepare('SELECT * FROM student_semesters WHERE id = ?').get(id);
  return res.json(row);
});

// Set as current semester
semestersRouter.post('/:id/set-current', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sem = await db.prepare('SELECT id FROM student_semesters WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!sem) return res.status(404).json({ detail: 'Semester not found' });
  await db.prepare('UPDATE student_semesters SET is_current = 0 WHERE user_id = ?').run(req.user.id);
  await db.prepare('UPDATE student_semesters SET is_current = 1 WHERE id = ?').run(id);
  const row = await db.prepare('SELECT * FROM student_semesters WHERE id = ?').get(id);
  return res.json(row);
});

// Delete semester (unlink courses; do not delete courses)
semestersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const sem = await db.prepare('SELECT id FROM student_semesters WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!sem) return res.status(404).json({ detail: 'Semester not found' });
  await db.prepare('UPDATE student_courses SET semester_id = NULL WHERE semester_id = ?').run(id);
  await db.prepare('DELETE FROM student_semesters WHERE id = ?').run(id);
  return res.status(204).send();
});
