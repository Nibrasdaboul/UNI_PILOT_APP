import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { initDb } from './db.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { studentRouter } from './routes/student.js';
import { semestersRouter } from './routes/semesters.js';
import { adminRouter } from './routes/admin.js';
import { plannerRouter } from './routes/planner.js';
import { aiRouter } from './routes/ai.js';
import { studyRouter } from './routes/study.js';
import { voiceRouter } from './routes/voice.js';
import { ttsRouter } from './routes/tts.js';
import { thesesRouter } from './routes/theses.js';
import { diagramsRouter } from './routes/diagrams.js';
import { notificationsRouter } from './routes/notifications.js';
import { authMiddleware } from './middleware/auth.js';
import { db } from './db.js';
import * as groq from './ai/groq.js';
import {
  computeFinalMarkFromItems,
  computeSemesterGpa,
  computeSemesterPercent,
  computeCGPA,
  computeCumPercent,
  markToLetter,
  markToGpaPoints,
  getGradeStatus,
} from './lib/gradeUtils.js';
import bcrypt from 'bcryptjs';

// Recompute cumulative stats from finalized courses (single source of truth for display)
function recomputeCumulativeFromCourses(coursesList) {
  const passed = coursesList.filter((c) => c.finalized_at != null && c.passed === 1);
  const failed = coursesList.filter((c) => c.finalized_at != null && c.passed === 0);
  const creditsCompleted = passed.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const creditsCarried = failed.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const withMark = passed.map((c) => ({ ...c, final_mark: c.current_grade }));
  const cgpa = computeSemesterGpa(withMark); // same formula: weighted avg by credits
  const cumPercent = computeSemesterPercent(withMark);
  return { creditsCompleted, creditsCarried, cgpa, cumPercent };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await initDb();

async function seedDefaultUsers() {
  const adminHash = bcrypt.hashSync('Admin123!', 10);
  const studentHash = bcrypt.hashSync('Student123!', 10);
  const defaults = [
    { email: 'admin@unipilot.local', hash: adminHash, name: 'Admin', role: 'admin' },
    { email: 'adm@unipilot.local', hash: adminHash, name: 'Admin 2', role: 'admin' },
    { email: 'student@unipilot.local', hash: studentHash, name: 'Student', role: 'student' },
  ];
  for (const u of defaults) {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (existing) continue;
    await db.prepare('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)').run(u.email, u.hash, u.name, u.role);
    console.log('Created:', u.email, u.role === 'admin' ? '/ Admin123!' : '/ Student123!');
  }
}
await seedDefaultUsers();

// Recalculate final mark for a student_course from grade_items and update student_courses.current_grade
async function recalcCourseGrade(studentCourseId) {
  const items = await db.prepare('SELECT score, max_score, weight FROM grade_items WHERE student_course_id = ?').all(studentCourseId);
  const finalMark = computeFinalMarkFromItems(items);
  await db.prepare('UPDATE student_courses SET current_grade = ? WHERE id = ?').run(finalMark ?? null, studentCourseId);
  return finalMark;
}

// When total weight >= 100%, finalize course: add credits to completed (pass) or carried (fail)
async function maybeFinalizeCourse(studentCourseId, userId) {
  const uid = Number(userId);
  const course = await db.prepare('SELECT id, user_id, credit_hours, current_grade, finalized_at FROM student_courses WHERE id = ?').get(studentCourseId);
  if (!course || Number(course.user_id) !== uid) return;
  if (course.finalized_at != null) return; // already finalized
  const items = await db.prepare('SELECT weight FROM grade_items WHERE student_course_id = ?').all(studentCourseId);
  const totalWeight = items.reduce((s, i) => s + (Number(i.weight) || 0), 0);
  const finalMark = course.current_grade;
  if (totalWeight < 99.5 || finalMark == null) return; // allow 99.5 for float rounding
  await applyFinalize(studentCourseId, uid, course, finalMark);
}

// Apply finalize: set finalized_at, passed, and update academic record (used by manual finalize and maybeFinalizeCourse)
async function applyFinalize(studentCourseId, uid, course, finalMark) {
  const passed = (Number(finalMark) ?? 0) >= 50 ? 1 : 0;
  await db.prepare('UPDATE student_courses SET finalized_at = CURRENT_TIMESTAMP, passed = ? WHERE id = ?').run(passed, studentCourseId);
  const creditHours = Number(course.credit_hours) || 0;
  if (creditHours <= 0) return;
  let record = await db.prepare('SELECT * FROM student_academic_record WHERE user_id = ?').get(uid);
  if (!record) {
    await db.prepare('INSERT INTO student_academic_record (user_id, cgpa, cumulative_percent, total_credits_completed, total_credits_carried) VALUES (?, 0, 0, 0, 0)').run(uid);
    record = await db.prepare('SELECT * FROM student_academic_record WHERE user_id = ?').get(uid);
  }
  const cgpaOld = Number(record.cgpa) || 0;
  const cumPercentOld = Number(record.cumulative_percent) || 0;
  const creditsCompletedOld = Number(record.total_credits_completed) || 0;
  const creditsCarriedOld = Number(record.total_credits_carried) || 0;
  if (passed) {
    const gpaPoints = markToGpaPoints(finalMark);
    const cgpaNew = computeCGPA(cgpaOld, creditsCompletedOld, gpaPoints, creditHours);
    const cumPercentNew = computeCumPercent(cumPercentOld, creditsCompletedOld, finalMark, creditHours);
    const newCompleted = creditsCompletedOld + creditHours;
    await db.prepare('UPDATE student_academic_record SET cgpa = ?, cumulative_percent = ?, total_credits_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(cgpaNew, cumPercentNew, newCompleted, uid);
  } else {
    const newCarried = creditsCarriedOld + creditHours;
    await db.prepare('UPDATE student_academic_record SET total_credits_carried = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(newCarried, uid);
  }
}

// Manual finalize: student clicks "انتهى" — recalc grade then finalize (no weight requirement)
async function finalizeCourseManually(courseId, userId) {
  const uid = Number(userId);
  const course = await db.prepare('SELECT id, user_id, credit_hours, current_grade, finalized_at FROM student_courses WHERE id = ?').get(courseId);
  if (!course || Number(course.user_id) !== uid) return { ok: false, code: 404 };
  if (course.finalized_at != null) return { ok: true, already: true };
  await recalcCourseGrade(courseId);
  const updated = await db.prepare('SELECT current_grade FROM student_courses WHERE id = ?').get(courseId);
  const finalMark = updated?.current_grade != null ? Number(updated.current_grade) : null;
  if (finalMark == null) return { ok: false, code: 400, message: 'Enter at least one grade before marking course as finished.' };
  await applyFinalize(courseId, uid, { ...course, credit_hours: course.credit_hours }, finalMark);
  return { ok: true };
}

// Recommendation messages for app notes (Arabic)
const RECOMMENDATIONS = {
  high_risk_ar: 'توصية: علامتك في هذه المادة منخفضة جداً. ننصحك بمراجعة المحتوى وزيادة ساعات الدراسة والاستعانة بالمراجع أو الأستاذ.',
  at_risk_ar: 'توصية: علامتك تحتاج تحسيناً. ننصحك بمراجعة الدروس والتركيز على النقاط الضعيفة لرفع المعدل.',
  general_ar: 'لديك أكثر من مادة تحتاج تركيزاً. ننصحك بترتيب أولويات المراجعة وزيادة ساعات الدراسة للمواد الحرجة.',
};

// Encouraging messages for every note — so high achievers keep it up, low achievers stay motivated
const ENCOURAGEMENT = {
  safe: '💪 تشجيع: مستواك ممتاز. حافظ على هذا الانضباط والجدية، أنت على الطريق الصحيح.',
  normal: '✨ تشجيع: أداؤك جيد. واصل المراجعة والمثابرة لتحافظ على تقدمك وتطوّره.',
  at_risk: '🌟 تشجيع: لا تستسلم. كل تحسن يبدأ بخطوة؛ ركّز على نقاط التحسين وستلاحظ الفرق.',
  high_risk: '❤️ تشجيع: الإحباط طبيعي، لكنك أقوى منه. خذ وقتك، راجع خطوة بخطوة، ونحن معك.',
};

// Upsert app note for a course: status + recommendation when low + encouragement for all
async function upsertAppNoteForCourse(userId, studentCourseId, courseName, finalMark) {
  const status = getGradeStatus(finalMark);
  const statusLabels = { safe: 'آمن', normal: 'وضع عادي', at_risk: 'خطر', high_risk: 'خطر عالي' };
  const letter = finalMark != null ? markToLetter(finalMark) : '—';
  let content = finalMark != null
    ? `المادة: ${courseName}. العلامة: ${finalMark}، التقدير: ${letter}. الوضع: ${statusLabels[status] || status}.`
    : `المادة: ${courseName}. لم تُدخل علامات بعد.`;
  if (finalMark != null) {
    if (status === 'high_risk' || status === 'at_risk') {
      const rec = status === 'high_risk' ? RECOMMENDATIONS.high_risk_ar : RECOMMENDATIONS.at_risk_ar;
      content += '\n\n' + rec;
    }
    content += '\n\n' + (ENCOURAGEMENT[status] || ENCOURAGEMENT.normal);
  }
  const existing = await db.prepare('SELECT id FROM notes WHERE user_id = ? AND student_course_id = ? AND type = ?').get(userId, studentCourseId, 'app');
  if (existing) {
    await db.prepare('UPDATE notes SET content = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(content, existing.id);
  } else {
    await db.prepare('INSERT INTO notes (user_id, student_course_id, content, type) VALUES (?, ?, ?, ?)').run(userId, studentCourseId, content, 'app');
  }

  try {
    const title = `تحليل أداء جديد لمادة ${courseName}`;
    const type = status === 'high_risk' || status === 'at_risk' ? 'warning' : 'info';
    const link = `/courses/${studentCourseId}`;
    await db.prepare(
      'INSERT INTO notifications (user_id, title, body, type, link, source) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, title, content.slice(0, 600), type, link, 'app_note_course');
  } catch (_) {}
}

// Upsert a general app note (no course) for overall recommendation
async function upsertGeneralAppNote(userId, contentAr) {
  const existing = await db.prepare('SELECT id FROM notes WHERE user_id = ? AND type = ? AND student_course_id IS NULL').get(userId, 'app');
  if (existing) {
    await db.prepare('UPDATE notes SET content = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(contentAr, existing.id);
  } else {
    await db.prepare('INSERT INTO notes (user_id, student_course_id, content, type) VALUES (?, NULL, ?, ?)').run(userId, contentAr, 'app');
  }

  try {
    const title = 'تحديث جديد لتحليل أدائك الأكاديمي';
    await db.prepare(
      'INSERT INTO notifications (user_id, title, body, type, link, source) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, title, contentAr.slice(0, 600), 'info', '/analytics', 'app_note_general');
  } catch (_) {}
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers (ISO/OWASP). Disable CSP in dev for Vite HMR.
app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));

// Global rate limit: 300 requests per 15 min per IP (mitigate abuse)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many requests. Try again later.' },
}));

// Stricter rate limit for auth (brute-force protection): 10 attempts per 15 min per IP
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many login attempts. Try again later.' },
});

// CORS: in production restrict to FRONTEND_ORIGIN if set; otherwise allow same-origin
const corsOrigin = process.env.NODE_ENV === 'production' && process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
// Allow large payloads for TTS file upload (base64 PDF/DOCX/PPTX)
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({ status: 'ready', database: 'connected' });
  } catch (e) {
    res.status(503).json({ status: 'not ready', database: 'disconnected', error: process.env.NODE_ENV === 'production' ? undefined : e.message });
  }
});

app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/student/semesters', semestersRouter);
app.use('/api/student', studentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/planner', plannerRouter);
app.use('/api/ai', aiRouter);
app.use('/api/study', studyRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/theses', thesesRouter);
app.use('/api/diagrams', diagramsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const coursesList = await db.prepare(`
    SELECT id, course_name, course_code, current_grade, credit_hours, finalized_at, passed, semester_id FROM student_courses WHERE user_id = ?
  `).all(userId);
  const { creditsCompleted, creditsCarried, cgpa: cgpaFromRecord, cumPercent: cumPercentFromRecord } = recomputeCumulativeFromCourses(coursesList);
  const currentSemesterRow = await db.prepare('SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1 LIMIT 1').get(userId);
  const currentSemId = currentSemesterRow ? Number(currentSemesterRow.id) : null;
  const currentSemesterCourses = currentSemId != null
    ? coursesList.filter((c) => Number(c.semester_id) === currentSemId)
    : coursesList.filter((c) => c.finalized_at == null);
  const coursesWithMark = currentSemesterCourses.map((c) => ({ ...c, final_mark: c.current_grade }));
  const semesterGpa = computeSemesterGpa(coursesWithMark);
  const semesterPercent = computeSemesterPercent(coursesWithMark);
  const creditsCurrent = currentSemesterCourses.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const gradedCreditsCurrent = currentSemesterCourses
    .filter((c) => c.current_grade != null)
    .reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const cgpa = computeCGPA(cgpaFromRecord, creditsCompleted, semesterGpa, gradedCreditsCurrent);
  const cumulativePercent = computeCumPercent(cumPercentFromRecord, creditsCompleted, semesterPercent, gradedCreditsCurrent);
  const avgProgress = coursesList.length ? coursesList.reduce((s, c) => s + (c.current_grade || 0), 0) / coursesList.length : 0;
  const finalizedPassed = coursesList.filter((c) => c.finalized_at != null && c.passed === 1);
  const finalizedFailed = coursesList.filter((c) => c.finalized_at != null && c.passed === 0);
  const completed_courses = finalizedPassed.map((c) => ({
    course_name: c.course_name,
    course_code: c.course_code,
    percent: c.current_grade != null ? Number(c.current_grade) : null,
    gpa_points: c.current_grade != null ? markToGpaPoints(c.current_grade) : null,
    letter_grade: c.current_grade != null ? markToLetter(c.current_grade) : null,
  }));
  const carried_courses = finalizedFailed.map((c) => ({
    course_name: c.course_name,
    course_code: c.course_code,
    percent: c.current_grade != null ? Number(c.current_grade) : null,
    gpa_points: c.current_grade != null ? markToGpaPoints(c.current_grade) : null,
    letter_grade: c.current_grade != null ? markToLetter(c.current_grade) : null,
  }));
  return res.json({
    pending_tasks: 0,
    today_sessions: 0,
    courses_count: coursesList.length,
    avg_progress: avgProgress,
    upcoming_tasks: [],
    semester_gpa: semesterGpa,
    cgpa,
    semester_percent: semesterPercent,
    cumulative_percent: cumulativePercent,
    credits_completed: creditsCompleted,
    credits_carried: creditsCarried,
    credits_current: creditsCurrent,
    completed_courses,
    carried_courses,
    courses: coursesList.map((c) => ({
      id: c.id,
      course_name: c.course_name,
      course_code: c.course_code,
      current_grade: c.current_grade,
      credit_hours: c.credit_hours,
      progress: c.current_grade || 0,
      grade_status: getGradeStatus(c.current_grade),
      finalized_at: c.finalized_at,
      passed: c.passed,
    })),
  });
});

app.get('/api/courses/:courseId', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.courseId, 10);
  const row = await db.prepare('SELECT * FROM student_courses WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  return res.json(row);
});

app.get('/api/courses/:courseId/resources', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const row = await db.prepare('SELECT id, catalog_course_id FROM student_courses WHERE id = ? AND user_id = ?').get(courseId, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  const catalogId = row.catalog_course_id;
  if (!catalogId) return res.json([]);
  const rows = await db.prepare('SELECT id, catalog_course_id, title, url, created_at FROM catalog_resources WHERE catalog_course_id = ? ORDER BY id').all(catalogId);
  return res.json(rows);
});

app.post('/api/courses/:courseId/finalize', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const result = await finalizeCourseManually(courseId, req.user.id);
  if (result.code === 404) return res.status(404).json({ detail: 'Not found' });
  if (result.code === 400) return res.status(400).json({ detail: result.message || 'Add at least one grade before marking as finished.' });
  return res.json({ finalized: true, already: result.already || false });
});

// Modules (units) CRUD — verify course belongs to user
async function ensureCourseOwnership(courseId, userId) {
  const row = await db.prepare('SELECT id FROM student_courses WHERE id = ? AND user_id = ?').get(courseId, userId);
  if (!row) return null;
  return row;
}
app.get('/api/courses/:courseId/modules', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const list = await db.prepare('SELECT id, student_course_id, title, description, sort_order, created_at FROM course_modules WHERE student_course_id = ? ORDER BY sort_order ASC, id ASC').all(courseId);
  const withItems = await Promise.all(list.map(async (m) => {
    const items = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE course_module_id = ? ORDER BY sort_order ASC, id ASC').all(m.id);
    return { ...m, items };
  }));
  return res.json(withItems);
});
app.post('/api/courses/:courseId/modules', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const b = req.body || {};
  const title = (b.title || '').trim() || (req.body?.title ? String(req.body.title) : 'Unit');
  const description = b.description != null ? String(b.description) : null;
  const maxOrder = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS mx FROM course_modules WHERE student_course_id = ?').get(courseId);
  const sortOrder = (maxOrder?.mx ?? 0) + 1;
  const r = await db.prepare('INSERT INTO course_modules (student_course_id, title, description, sort_order) VALUES (?, ?, ?, ?)').run(courseId, title, description, sortOrder);
  const id = r.lastInsertRowid;
  const row = await db.prepare('SELECT id, student_course_id, title, description, sort_order, created_at FROM course_modules WHERE id = ?').get(id);
  const items = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE course_module_id = ? ORDER BY sort_order ASC, id ASC').all(id);
  return res.status(201).json({ ...row, items: items || [] });
});
app.patch('/api/courses/:courseId/modules/:moduleId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare(`
    SELECT cm.id, cm.student_course_id
    FROM course_modules cm
    JOIN student_courses sc ON sc.id = cm.student_course_id
    WHERE cm.id = ? AND sc.user_id = ?
  `).get(moduleId, req.user.id);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  const b = req.body || {};
  if (b.title != null) await db.prepare('UPDATE course_modules SET title = ? WHERE id = ?').run((b.title || '').trim() || 'Unit', moduleId);
  if (b.description !== undefined) await db.prepare('UPDATE course_modules SET description = ? WHERE id = ?').run(b.description == null ? null : String(b.description), moduleId);
  const row = await db.prepare('SELECT id, student_course_id, title, description, sort_order, created_at FROM course_modules WHERE id = ?').get(moduleId);
  const items = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE course_module_id = ? ORDER BY sort_order ASC, id ASC').all(moduleId);
  return res.json({ ...row, items: items || [] });
});
app.delete('/api/courses/:courseId/modules/:moduleId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare(`
    SELECT cm.id, cm.student_course_id
    FROM course_modules cm
    JOIN student_courses sc ON sc.id = cm.student_course_id
    WHERE cm.id = ? AND sc.user_id = ?
  `).get(moduleId, req.user.id);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  await db.prepare('DELETE FROM course_module_items WHERE course_module_id = ?').run(moduleId);
  await db.prepare('DELETE FROM course_modules WHERE id = ?').run(moduleId);
  return res.status(204).send();
});
// Module items (folders / files) CRUD
app.get('/api/courses/:courseId/modules/:moduleId/items', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare('SELECT id FROM course_modules WHERE id = ? AND student_course_id = ?').get(moduleId, courseId);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  const items = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE course_module_id = ? ORDER BY sort_order ASC, id ASC').all(moduleId);
  return res.json(items);
});
app.post('/api/courses/:courseId/modules/:moduleId/items', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare('SELECT id FROM course_modules WHERE id = ? AND student_course_id = ?').get(moduleId, courseId);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  const b = req.body || {};
  const type = (b.type === 'folder' || b.type === 'file') ? b.type : 'file';
  const title = (b.title || '').trim() || (type === 'folder' ? 'Folder' : 'File');
  const urlOrContent = b.url_or_content != null ? String(b.url_or_content) : null;
  const maxOrder = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS mx FROM course_module_items WHERE course_module_id = ?').get(moduleId);
  const sortOrder = (maxOrder?.mx ?? 0) + 1;
  const r = await db.prepare('INSERT INTO course_module_items (course_module_id, type, title, url_or_content, sort_order) VALUES (?, ?, ?, ?, ?)').run(moduleId, type, title, urlOrContent, sortOrder);
  const id = r.lastInsertRowid;
  const row = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE id = ?').get(id);
  return res.status(201).json(row);
});
app.patch('/api/courses/:courseId/modules/:moduleId/items/:itemId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare('SELECT id FROM course_modules WHERE id = ? AND student_course_id = ?').get(moduleId, courseId);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  const item = await db.prepare('SELECT id FROM course_module_items WHERE id = ? AND course_module_id = ?').get(itemId, moduleId);
  if (!item) return res.status(404).json({ detail: 'Item not found' });
  const b = req.body || {};
  if (b.type != null && (b.type === 'folder' || b.type === 'file')) await db.prepare('UPDATE course_module_items SET type = ? WHERE id = ?').run(b.type, itemId);
  if (b.title != null) await db.prepare('UPDATE course_module_items SET title = ? WHERE id = ?').run((b.title || '').trim(), itemId);
  if (b.url_or_content !== undefined) await db.prepare('UPDATE course_module_items SET url_or_content = ? WHERE id = ?').run(b.url_or_content == null ? null : String(b.url_or_content), itemId);
  const row = await db.prepare('SELECT id, course_module_id, type, title, url_or_content, sort_order, created_at FROM course_module_items WHERE id = ?').get(itemId);
  return res.json(row);
});
app.delete('/api/courses/:courseId/modules/:moduleId/items/:itemId', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const moduleId = parseInt(req.params.moduleId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (!(await ensureCourseOwnership(courseId, req.user.id))) return res.status(404).json({ detail: 'Not found' });
  const mod = await db.prepare('SELECT id FROM course_modules WHERE id = ? AND student_course_id = ?').get(moduleId, courseId);
  if (!mod) return res.status(404).json({ detail: 'Module not found' });
  const item = await db.prepare('SELECT id FROM course_module_items WHERE id = ? AND course_module_id = ?').get(itemId, moduleId);
  if (!item) return res.status(404).json({ detail: 'Item not found' });
  await db.prepare('DELETE FROM course_module_items WHERE id = ?').run(itemId);
  return res.status(204).send();
});

// Grades CRUD (simple, no enforced catalog scheme)
app.get('/api/courses/:courseId/grades', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const row = await db.prepare('SELECT id FROM student_courses WHERE id = ? AND user_id = ?').get(courseId, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  const items = await db.prepare('SELECT id, item_type, title, score, max_score, weight, created_at FROM grade_items WHERE student_course_id = ? ORDER BY created_at').all(courseId);
  return res.json(items);
});
app.post('/api/courses/:courseId/grades', authMiddleware, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const row = await db.prepare('SELECT id, user_id, course_name FROM student_courses WHERE id = ? AND user_id = ?').get(courseId, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  const b = req.body || {};
  const itemType = b.item_type || 'quiz';
  const title = b.title || 'Grade';
  const score = Number(b.score) ?? 0;
  const maxScore = Number(b.max_score) ?? 100;
  const weight = Number(b.weight) ?? 0;
  if (score < 0 || score > maxScore) {
    return res.status(400).json({ detail: 'Score cannot exceed max score' });
  }
  const r = await db.prepare('INSERT INTO grade_items (student_course_id, item_type, title, score, max_score, weight) VALUES (?, ?, ?, ?, ?, ?)').run(courseId, itemType, title, score, maxScore, weight);
  const id = r.lastInsertRowid;
  const finalMark = await recalcCourseGrade(courseId);
  await upsertAppNoteForCourse(req.user.id, courseId, row.course_name, finalMark);
  await maybeFinalizeCourse(courseId, req.user.id);
  const item = await db.prepare('SELECT id, item_type, title, score, max_score, weight, from_scheme, created_at FROM grade_items WHERE id = ?').get(id);
  return res.status(201).json(item);
});
app.patch('/api/grades/:id', authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) return res.status(400).json({ detail: 'Invalid grade id' });
  const item = await db.prepare('SELECT gi.id, gi.student_course_id, gi.max_score, sc.user_id, sc.course_name FROM grade_items gi JOIN student_courses sc ON sc.id = gi.student_course_id WHERE gi.id = ?').get(id);
  if (!item) return res.status(404).json({ detail: 'Grade not found' });
  const userId = Number(req.user.id);
  const ownerId = Number(item.user_id);
  if (userId !== ownerId) return res.status(404).json({ detail: 'Not found' });
  const b = req.body || {};
  if (b.item_type != null) await db.prepare('UPDATE grade_items SET item_type = ? WHERE id = ?').run(b.item_type, id);
  if (b.title != null) await db.prepare('UPDATE grade_items SET title = ? WHERE id = ?').run(b.title, id);
  if (b.weight != null) await db.prepare('UPDATE grade_items SET weight = ? WHERE id = ?').run(Number(b.weight), id);
  if (b.max_score != null) await db.prepare('UPDATE grade_items SET max_score = ? WHERE id = ?').run(Number(b.max_score), id);
  if (b.score != null) {
    const maxScore = b.max_score != null ? Number(b.max_score) : Number(item.max_score);
    const newScore = Number(b.score);
    if (newScore < 0 || newScore > maxScore) {
      return res.status(400).json({ detail: 'Score cannot exceed max score' });
    }
    await db.prepare('UPDATE grade_items SET score = ? WHERE id = ?').run(newScore, id);
  }
  const finalMark = await recalcCourseGrade(item.student_course_id);
  await upsertAppNoteForCourse(req.user.id, item.student_course_id, item.course_name, finalMark);
  await maybeFinalizeCourse(item.student_course_id, req.user.id);
  const updated = await db.prepare('SELECT id, item_type, title, score, max_score, weight, from_scheme, created_at FROM grade_items WHERE id = ?').get(id);
  return res.json(updated);
});
app.delete('/api/grades/:id', authMiddleware, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) return res.status(400).json({ detail: 'Invalid grade id' });
  const item = await db.prepare('SELECT gi.id, gi.student_course_id, sc.user_id, sc.course_name FROM grade_items gi JOIN student_courses sc ON sc.id = gi.student_course_id WHERE gi.id = ?').get(id);
  if (!item) return res.status(404).json({ detail: 'Grade not found' });
  const userId = Number(req.user.id);
  const ownerId = Number(item.user_id);
  if (userId !== ownerId) return res.status(404).json({ detail: 'Not found' });
  await db.prepare('DELETE FROM grade_items WHERE id = ?').run(id);
  const finalMark = await recalcCourseGrade(item.student_course_id);
  await upsertAppNoteForCourse(req.user.id, item.student_course_id, item.course_name, finalMark);
  await maybeFinalizeCourse(item.student_course_id, req.user.id);
  return res.status(204).send();
});

// Notes — AI improve student note content
app.post('/api/notes/improve', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) return res.status(503).json({ detail: 'AI not configured' });
    const content = (req.body && req.body.content) || '';
    const lang = req.body && req.body.lang === 'en' ? 'en' : 'ar';
    const improved = await groq.improveNote(content, lang);
    return res.json({ improved });
  } catch (e) {
    console.error('Notes improve error:', e);
    return res.status(500).json({ detail: e.message || 'Improve failed' });
  }
});

// Notes — sync app notes for all graded courses and general recommendation, then return list
app.get('/api/notes', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const type = req.query.type; // 'student' | 'app' | omit for all

  const gradedCourses = await db.prepare('SELECT id, course_name, current_grade FROM student_courses WHERE user_id = ? AND current_grade IS NOT NULL').all(userId);
  let atRiskCount = 0;
  for (const c of gradedCourses) {
    await upsertAppNoteForCourse(userId, c.id, c.course_name, c.current_grade);
    const status = getGradeStatus(c.current_grade);
    if (status === 'at_risk' || status === 'high_risk') atRiskCount++;
  }
  if (atRiskCount >= 2) {
    const generalContent = RECOMMENDATIONS.general_ar + '\n\n' + ENCOURAGEMENT.high_risk;
    await upsertGeneralAppNote(userId, generalContent);
  } else {
    await db.prepare(
      "DELETE FROM notes WHERE user_id = ? AND type = 'app' AND student_course_id IS NULL AND (note_category IS NULL OR note_category = '')"
    ).run(userId);
  }

  let sql = 'SELECT n.id, n.student_course_id, n.content, n.type, n.created_at, n.note_category, n.ref_id, n.ref_type FROM notes n WHERE n.user_id = ?';
  const params = [userId];
  if (type === 'student' || type === 'app') {
    sql += ' AND n.type = ?';
    params.push(type);
  }
  sql += ' ORDER BY n.created_at DESC';
  const rows = await db.prepare(sql).all(...params);
  const courseIds = [...new Set(rows.map(r => r.student_course_id).filter(Boolean))];
  const names = {};
  if (courseIds.length) {
    const placeholders = courseIds.map((_, i) => '?').join(',');
    const courses = await db.prepare(`SELECT id, course_name FROM student_courses WHERE id IN (${placeholders})`).all(...courseIds);
    courses.forEach(c => { names[c.id] = c.course_name; });
  }
  const quizIds = [...new Set(rows.filter(r => r.note_category === 'exam_insight' && r.ref_type === 'quiz' && r.ref_id).map(r => r.ref_id))];
  const quizTitles = {};
  if (quizIds.length) {
    const placeholders = quizIds.map((_, i) => '?').join(',');
    const quizzes = await db.prepare(`SELECT id, title FROM study_quizzes WHERE id IN (${placeholders})`).all(...quizIds);
    quizzes.forEach(q => { quizTitles[q.id] = q.title || ''; });
  }
  const list = rows.map(r => {
    const out = { ...r, course_name: r.student_course_id ? names[r.student_course_id] : null };
    if (r.note_category === 'exam_insight' && r.ref_type === 'quiz' && r.ref_id) {
      out.quiz_title = quizTitles[r.ref_id] || null;
    }
    return out;
  });
  return res.json(list);
});
app.post('/api/notes', authMiddleware, async (req, res) => {
  const b = req.body || {};
  const content = b.content || '';
  const studentCourseId = b.student_course_id != null ? parseInt(b.student_course_id, 10) : null;
  if (studentCourseId != null) {
    const ok = await db.prepare('SELECT id FROM student_courses WHERE id = ? AND user_id = ?').get(studentCourseId, req.user.id);
    if (!ok) return res.status(404).json({ detail: 'Course not found' });
  }
  const r = await db.prepare('INSERT INTO notes (user_id, student_course_id, content, type) VALUES (?, ?, ?, ?)').run(req.user.id, studentCourseId, content, 'student');
  const row = await db.prepare('SELECT id, student_course_id, content, type, created_at FROM notes WHERE id = ?').get(r.lastInsertRowid);
  return res.status(201).json(row);
});
app.patch('/api/notes/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await db.prepare('SELECT id, type FROM notes WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  if (row.type !== 'student') return res.status(403).json({ detail: 'Only student notes can be edited' });
  const content = req.body?.content;
  if (content != null) await db.prepare('UPDATE notes SET content = ? WHERE id = ?').run(content, id);
  const updated = await db.prepare('SELECT id, student_course_id, content, type, created_at FROM notes WHERE id = ?').get(id);
  return res.json(updated);
});
app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await db.prepare('SELECT id FROM notes WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  await db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return res.status(204).send();
});

// Analytics
app.get('/api/analytics', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const coursesList = await db.prepare(`
    SELECT id, course_name, course_code, current_grade, credit_hours, finalized_at, passed, semester_id FROM student_courses WHERE user_id = ?
  `).all(userId);
  const { creditsCompleted, creditsCarried, cgpa: cgpaFromRecord, cumPercent: cumPercentFromRecord } = recomputeCumulativeFromCourses(coursesList);
  const currentSemesterRow = await db.prepare('SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1 LIMIT 1').get(userId);
  const currentSemId = currentSemesterRow ? Number(currentSemesterRow.id) : null;
  const currentSemesterCourses = currentSemId != null
    ? coursesList.filter((c) => Number(c.semester_id) === currentSemId)
    : coursesList.filter((c) => c.finalized_at == null);
  const coursesWithMark = currentSemesterCourses.map((c) => ({ ...c, final_mark: c.current_grade }));
  const semesterGpa = computeSemesterGpa(coursesWithMark);
  const semesterPercent = computeSemesterPercent(coursesWithMark);
  const creditsCurrent = currentSemesterCourses.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const gradedCreditsCurrent = currentSemesterCourses
    .filter((c) => c.current_grade != null)
    .reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
  const cgpa = computeCGPA(cgpaFromRecord, creditsCompleted, semesterGpa, gradedCreditsCurrent);
  const cumulativePercent = computeCumPercent(cumPercentFromRecord, creditsCompleted, semesterPercent, gradedCreditsCurrent);
  const courses = coursesList.map(c => ({
    id: c.id,
    course_name: c.course_name,
    course_code: c.course_code,
    credit_hours: c.credit_hours,
    final_mark: c.current_grade,
    letter: c.current_grade != null ? markToLetter(c.current_grade) : null,
    gpa_points: c.current_grade != null ? markToGpaPoints(c.current_grade) : null,
    status: getGradeStatus(c.current_grade),
  }));
  return res.json({
    courses,
    semester_gpa: semesterGpa,
    semester_percent: semesterPercent,
    cgpa,
    cumulative_percent: cumulativePercent,
    credits_completed: creditsCompleted,
    credits_carried: creditsCarried,
    credits_current: creditsCurrent,
  });
});
app.get('/api/courses/:courseId/chat', authMiddleware, (req, res) => res.json([]));
app.post('/api/courses/:courseId/chat', authMiddleware, (req, res) => res.status(201).send());
app.delete('/api/courses/:courseId/chat', authMiddleware, (req, res) => res.status(204).send());
app.get('/api/tasks/upcoming', authMiddleware, async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  const tasks = await db.prepare(`
    SELECT t.id, t.title, t.due_date, t.completed, sc.course_name FROM planner_tasks t
    LEFT JOIN student_courses sc ON sc.id = t.student_course_id
    WHERE t.user_id = ? AND t.due_date >= ? ORDER BY t.due_date LIMIT 20
  `).all(req.user.id, date);
  return res.json(tasks.map(t => ({ ...t, status: t.completed ? 'completed' : 'pending' })));
});
app.get('/api/insights/predictions', authMiddleware, (req, res) => res.json([]));
app.patch('/api/auth/settings', authMiddleware, async (req, res) => {
  const b = req.body || {};
  if (b.full_name) await db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(b.full_name, req.user.id);
  const user = await db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  return res.json(user);
});

// Serve built frontend (Vite) when running as a full web app (e.g. on Render Web Service)
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ detail: 'Not found' });
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Run "npm run build" then restart the server.'));
}

// Global error handler (uncaught errors in route handlers)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ detail: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error') });
});

const isEntry = process.argv[1] && resolve(process.argv[1]) === __filename;
if (isEntry) {
  app.listen(PORT, () => {
    console.log(`UniPilot API running at http://localhost:${PORT}`);
    console.log(`Auth: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me`);
    console.log(`Catalog: GET/POST /api/catalog/courses, PATCH/DELETE /api/catalog/courses/:id`);
    console.log(`Student: GET/POST/DELETE /api/student/courses`);
    console.log(process.env.GROQ_API_KEY ? 'AI (Groq): configured' : 'AI (Groq): not configured — set GROQ_API_KEY in .env (see AI_SETUP.md)');
  });
}

export { app, PORT };
