/**
 * Gamification: XP, level, daily challenge, puzzle (course-related).
 */
import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import * as groq from '../ai/groq.js';

export const gamificationRouter = Router();
gamificationRouter.use(authMiddleware);

const XP_PER_LEVEL = 100;
const XP_SOURCES = {
  study_quiz: 30,
  flashcards: 20,
  daily_challenge: 50,
  daily_challenge_question: 100,
  add_grade: 5,
  complete_task: 10,
  puzzle: 15,
  mindmap: 10,
};

function levelFromXp(xp) {
  return 1 + Math.floor((xp || 0) / XP_PER_LEVEL);
}

function xpForNextLevel(xp) {
  const current = xp || 0;
  const nextLevelStart = levelFromXp(current) * XP_PER_LEVEL;
  return Math.max(0, nextLevelStart - current);
}

gamificationRouter.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const row = await db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
    const xp = Number(row?.xp ?? 0);
    const today = new Date().toISOString().slice(0, 10);
    const dailyRow = await db.prepare(
      'SELECT completed_at, xp_awarded FROM user_daily_challenges WHERE user_id = ? AND for_date = ?'
    ).get(userId, today);
    const dailyCompleted = !!dailyRow?.completed_at;
    const streakRes = await db.prepare(`
      SELECT for_date FROM user_daily_challenges
      WHERE user_id = ? AND completed_at IS NOT NULL
      ORDER BY for_date DESC LIMIT 14
    `).all(userId);
    let streak = 0;
    const rows = Array.isArray(streakRes) ? streakRes : [];
    const dates = rows.map((r) => (r.for_date != null ? String(r.for_date).slice(0, 10) : '')).filter(Boolean);
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const expected = d.toISOString().slice(0, 10);
      if (dates[i] === expected) streak++;
      else break;
    }
    res.json({
      xp,
      level: levelFromXp(xp),
      xp_for_next: xpForNextLevel(xp),
      xp_per_level: XP_PER_LEVEL,
      daily_completed: dailyCompleted,
      streak,
    });
  } catch (e) {
    console.error('Gamification /me error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.post('/earn', async (req, res) => {
  try {
    const userId = req.user.id;
  const source = req.body?.source || 'misc';
  const amount = Number(req.body?.amount) || XP_SOURCES[source] || 10;
  const forDaily = !!req.body?.for_daily;
  const today = new Date().toISOString().slice(0, 10);
  await db.prepare('UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?').run(amount, userId);
  if (forDaily) {
  const sourceToKey = { study_quiz: 'quiz', flashcards: 'flashcards', add_grade: 'grade', complete_task: 'task', mindmap: 'mindmap', smart_question: 'smart_question' };
    const challengeKeys = ['smart_question', 'quiz', 'flashcards', 'task', 'mindmap'];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const todayKey = challengeKeys[dayOfYear % challengeKeys.length];
    const matchesDaily = sourceToKey[source] === todayKey;
    if (matchesDaily) {
      await db.prepare(`
        INSERT INTO user_daily_challenges (user_id, for_date, challenge_key, completed_at, xp_awarded)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT (user_id, for_date) DO UPDATE SET completed_at = CURRENT_TIMESTAMP, xp_awarded = ?
      `).run(userId, today, 'daily', amount, amount);
    }
  }
  const row = await db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
  res.json({ xp: Number(row?.xp ?? 0), earned: amount });
  } catch (e) {
    console.error('Gamification /earn error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.get('/daily-challenge', async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const today = new Date().toISOString().slice(0, 10);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

    const courses = await db.prepare(`
      SELECT id, course_name, course_code, description
      FROM student_courses
      WHERE user_id = ? AND withdrawn != 1
        AND (finalized_at IS NULL OR semester_id IN (SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1))
      ORDER BY id
    `).all(userId, userId);
    const list = Array.isArray(courses) ? courses : [];

    if (list.length === 0) {
      return res.status(404).json({
        detail: lang === 'ar' ? 'أضف مواد الفصل الحالي لعرض تحدي اليوم' : 'Add current semester courses to get today\'s challenge',
      });
    }

    const courseIndex = (dayOfYear + userId) % list.length;
    const course = list[courseIndex];
    const courseName = course.course_name || course.course_code || '';

    let row = await db.prepare(
      'SELECT id, question_text, options_json FROM daily_challenge_questions WHERE user_id = ? AND for_date = ?'
    ).get(userId, today);

    if (!row) {
      if (!groq.isConfigured()) {
        return res.status(503).json({
          detail: lang === 'ar' ? 'الذكاء الاصطناعي غير مفعّل. فعّل GROQ_API_KEY لعرض تحدي اليوم.' : 'AI not configured. Set GROQ_API_KEY for daily challenge.',
        });
      }
      let contextText = (course.description || '').trim().slice(0, 2000);
      const { question, options, correct_index } = await groq.generateDailyChallengeQuestion(courseName, contextText, lang);
      const optionsJson = JSON.stringify(options || []);
      try {
        const r = await db.prepare(
          'INSERT INTO daily_challenge_questions (user_id, for_date, student_course_id, question_text, options_json, correct_index) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(userId, today, course.id, question, optionsJson, correct_index);
        const id = r.lastInsertRowid;
        row = { id, question_text: question, options_json: optionsJson };
      } catch (insertErr) {
        if (insertErr.code === '23505' || insertErr.constraint === 'daily_challenge_questions_user_id_for_date_key') {
          row = await db.prepare(
            'SELECT id, question_text, options_json FROM daily_challenge_questions WHERE user_id = ? AND for_date = ?'
          ).get(userId, today);
        }
        if (!row) throw insertErr;
      }
    }

    const options = (() => {
      try {
        const arr = JSON.parse(row.options_json || '[]');
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    })();

    res.json({
      type: 'daily_question',
      question: row.question_text,
      options: options.map((label, i) => ({ label: String(label).slice(0, 500), value: String(i) })),
      daily_challenge_id: row.id,
      course_name: courseName,
      xp: XP_SOURCES.daily_challenge_question || 100,
    });
  } catch (e) {
    console.error('Gamification /daily-challenge error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.post('/daily-challenge/validate', async (req, res) => {
  try {
    const userId = req.user.id;
    const dailyChallengeId = parseInt(req.body?.daily_challenge_id, 10);
    const selectedIndex = req.body?.selected_index != null ? parseInt(req.body.selected_index, 10) : -1;
    if (!dailyChallengeId || selectedIndex < 0) {
      return res.status(400).json({ detail: 'Missing daily_challenge_id or selected_index' });
    }
    const row = await db.prepare(
      'SELECT id, for_date, correct_index FROM daily_challenge_questions WHERE id = ? AND user_id = ?'
    ).get(dailyChallengeId, userId);
    if (!row) return res.status(404).json({ detail: 'Not found' });
    const correct = selectedIndex === Number(row.correct_index);
    const today = new Date().toISOString().slice(0, 10);
    const rowDate = row.for_date != null ? String(row.for_date).slice(0, 10) : '';
    if (rowDate !== today) {
      return res.status(400).json({ detail: 'Challenge expired' });
    }
    if (correct) {
      const amount = XP_SOURCES.daily_challenge_question || 100;
      await db.prepare('UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?').run(amount, userId);
      await db.prepare(`
        INSERT INTO user_daily_challenges (user_id, for_date, challenge_key, completed_at, xp_awarded)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT (user_id, for_date) DO UPDATE SET completed_at = CURRENT_TIMESTAMP, xp_awarded = ?
      `).run(userId, today, 'daily_question', amount, amount);
      const xpRow = await db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
      return res.json({ correct: true, xp_earned: amount, xp: Number(xpRow?.xp ?? 0) });
    }
    res.json({ correct: false });
  } catch (e) {
    console.error('Gamification daily-challenge/validate error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.get('/puzzle', async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const courses = await db.prepare(`
      SELECT id, course_code, course_name, current_grade, credit_hours
      FROM student_courses
      WHERE user_id = ? AND withdrawn != 1 AND (finalized_at IS NULL OR semester_id IN (SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1))
      ORDER BY id
    `).all(userId, userId);
    const list = Array.isArray(courses) ? courses : [];
    const seed = Math.floor(Date.now() / 60000);
    const letterGradePuzzles = [
      { pct: 78, letter: 'B+', ar: 'ما التقدير الحرفي لنسبة 78%؟', en: 'What is the letter grade for 78%?' },
      { pct: 92, letter: 'A-', ar: 'ما التقدير الحرفي لنسبة 92%؟', en: 'What is the letter grade for 92%?' },
      { pct: 65, letter: 'C', ar: 'ما التقدير الحرفي لنسبة 65%؟', en: 'What is the letter grade for 65%?' },
      { pct: 88, letter: 'B+', ar: 'ما التقدير الحرفي لنسبة 88%؟', en: 'What is the letter grade for 88%?' },
      { pct: 73, letter: 'C+', ar: 'ما التقدير الحرفي لنسبة 73%؟', en: 'What is the letter grade for 73%?' },
    ];
    const gradeTable = [
      { min: 95, letter: 'A' }, { min: 90, letter: 'A-' }, { min: 85, letter: 'B+' }, { min: 80, letter: 'B' },
      { min: 75, letter: 'B-' }, { min: 70, letter: 'C+' }, { min: 65, letter: 'C' }, { min: 60, letter: 'C-' },
      { min: 55, letter: 'D+' }, { min: 50, letter: 'D' }, { min: 0, letter: 'F' },
    ];
    // Letter grade question (used when < 2 graded courses)
    if (list.length >= 2) {
      const withGrade = list.filter((c) => c.current_grade != null);
      if (withGrade.length >= 2) {
        const sorted = [...withGrade].sort((a, b) => Number(a.current_grade) - Number(b.current_grade));
        const lowest = sorted[0];
        const options = sorted.slice(0, 4);
        if (options.length < 4 && list.length >= 4) {
          const extra = list.filter((c) => !options.some((o) => o.id === c.id)).slice(0, 4 - options.length);
          options.push(...extra);
        }
        const uniqueById = [];
        const seen = new Set();
        for (const c of options) {
          if (!seen.has(c.id)) { seen.add(c.id); uniqueById.push(c); }
        }
        while (uniqueById.length < 4 && list.length > uniqueById.length) {
          const add = list.find((c) => !seen.has(c.id));
          if (add) { seen.add(add.id); uniqueById.push(add); } else break;
        }
        const shuffled = [...uniqueById].sort((a, b) => ((seed + a.id + b.id) % 2) ? 1 : -1);
        const questionAr = 'أي من موادك الحالية لديها أقل درجة حالية؟';
        const questionEn = 'Which of your current courses has the lowest current grade?';
        return res.json({
          type: 'mc',
          question: lang === 'ar' ? questionAr : questionEn,
          options: shuffled.map((c) => ({ label: c.course_name || c.course_code || '?', value: String(c.id) })),
          correct_value: String(lowest.id),
          seed,
        });
      }
    }

    // Fallback: letter grade question (no courses needed)
    const lg = letterGradePuzzles[seed % letterGradePuzzles.length];
    const wrongLetters = gradeTable.map((r) => r.letter).filter((l) => l !== lg.letter);
    const options = [lg.letter, wrongLetters[(seed + 1) % wrongLetters.length], wrongLetters[(seed + 3) % wrongLetters.length], wrongLetters[(seed + 5) % wrongLetters.length]];
    const uniqueOpts = [...new Set(options)];
    const shuffledOpts = uniqueOpts.sort((a, b) => (a.charCodeAt(0) + seed) % 2 ? 1 : -1);
    return res.json({
      type: 'mc',
      question: lang === 'ar' ? lg.ar : lg.en,
      options: shuffledOpts.map((l) => ({ label: l, value: l })),
      correct_value: lg.letter,
      seed,
    });
  } catch (e) {
    console.error('Gamification /puzzle error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.post('/puzzle/validate', async (req, res) => {
  try {
    const userId = req.user.id;
    const { selected_value, seed } = req.body || {};
    if (selected_value == null || seed == null) {
      return res.status(400).json({ detail: 'Missing selected_value or seed' });
    }
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const courses = await db.prepare(`
      SELECT id, course_code, course_name, current_grade, credit_hours
      FROM student_courses
      WHERE user_id = ? AND withdrawn != 1 AND (finalized_at IS NULL OR semester_id IN (SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1))
      ORDER BY id
    `).all(userId, userId);
    const list = Array.isArray(courses) ? courses : [];

    const letterGradePuzzles = [
      { pct: 78, letter: 'B+' }, { pct: 92, letter: 'A-' }, { pct: 65, letter: 'C' }, { pct: 88, letter: 'B+' }, { pct: 73, letter: 'C+' },
    ];
    const gradeTable = [
      { min: 95, letter: 'A' }, { min: 90, letter: 'A-' }, { min: 85, letter: 'B+' }, { min: 80, letter: 'B' },
      { min: 75, letter: 'B-' }, { min: 70, letter: 'C+' }, { min: 65, letter: 'C' }, { min: 60, letter: 'C-' },
      { min: 55, letter: 'D+' }, { min: 50, letter: 'D' }, { min: 0, letter: 'F' },
    ];

    let correct_value = null;
    if (list.length >= 2) {
      const withGrade = list.filter((c) => c.current_grade != null);
      if (withGrade.length >= 2) {
        const sorted = [...withGrade].sort((a, b) => Number(a.current_grade) - Number(b.current_grade));
        const lowest = sorted[0];
        correct_value = String(lowest.id);
      }
    }
    if (correct_value == null) {
      const lg = letterGradePuzzles[Math.abs(Number(seed)) % letterGradePuzzles.length];
      correct_value = lg.letter;
    }

    const correct = String(selected_value).trim() === String(correct_value).trim();
    if (correct) {
      const amount = XP_SOURCES.puzzle || 15;
      await db.prepare('UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?').run(amount, userId);
      const row = await db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
      return res.json({ correct: true, xp_earned: amount, xp: Number(row?.xp ?? 0) });
    }
    res.json({ correct: false });
  } catch (e) {
    console.error('Gamification puzzle/validate error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

// —— Smart question (AI-generated from student's courses + study content) ——

gamificationRouter.get('/smart-question', async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';
    const courses = await db.prepare(`
      SELECT id, course_name, course_code, description
      FROM student_courses
      WHERE user_id = ? AND withdrawn != 1 AND (finalized_at IS NULL OR semester_id IN (SELECT id FROM student_semesters WHERE user_id = ? AND is_current = 1))
      ORDER BY id
    `).all(userId, userId);
    const list = Array.isArray(courses) ? courses : [];
    if (list.length === 0) {
      return res.status(404).json({ detail: lang === 'ar' ? 'أضف مواد الفصل الحالي أولاً' : 'Add current semester courses first' });
    }
    const course = list[Math.floor(Math.random() * list.length)];
    const courseName = course.course_name || course.course_code || '';
    const courseDesc = (course.description || '').trim();

    let contextText = '';
    if (courseDesc) contextText = '[Course description]\n' + courseDesc.slice(0, 1500);
    const nameLower = courseName.toLowerCase();
    const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 2).slice(0, 5);
    const matchesCourse = (title, content) => {
      const t = (title || '').toLowerCase();
      const c = (content || '').toLowerCase();
      if (nameLower.length >= 4 && (t.includes(nameLower) || c.includes(nameLower))) return true;
      return nameWords.some((w) => w.length >= 3 && (t.includes(w) || c.includes(w)));
    };
    const summaries = await db.prepare('SELECT id, title, content FROM study_summaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);
    for (const s of Array.isArray(summaries) ? summaries : []) {
      if (!matchesCourse(s.title, s.content)) continue;
      contextText += '\n[Summary]: ' + (s.title || '') + '\n' + (s.content || '').slice(0, 1500);
      if (contextText.length > 5000) break;
    }
    const sets = await db.prepare('SELECT id, title FROM study_flashcard_sets WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(userId);
    for (const set of Array.isArray(sets) ? sets : []) {
      if (!matchesCourse(set.title, '')) continue;
      const cards = await db.prepare('SELECT front, back FROM study_flashcards WHERE set_id = ? ORDER BY sort_order LIMIT 15').all(set.id);
      const snippet = (cards || []).map((c) => (c.front || '') + ' → ' + (c.back || '')).join('\n');
      if (snippet) contextText += '\n[Flashcards]: ' + (set.title || '') + '\n' + snippet.slice(0, 2000);
      if (contextText.length > 6000) break;
    }
    const mindmaps = await db.prepare('SELECT id, title, content_json FROM study_mind_maps WHERE user_id = ? ORDER BY created_at DESC LIMIT 3').all(userId);
    for (const m of Array.isArray(mindmaps) ? mindmaps : []) {
      if (!matchesCourse(m.title, '')) continue;
      try {
        const content = JSON.parse(m.content_json || '{}');
        const label = content.label || '';
        const children = (content.children || []).map((c) => c.label || '').join(', ');
        contextText += '\n[Mind map]: ' + (m.title || '') + ' — ' + label + ' ' + children;
      } catch (_) {}
      if (contextText.length > 6500) break;
    }

    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: lang === 'ar' ? 'الذكاء الاصطناعي غير مفعّل. فعّل GROQ_API_KEY.' : 'AI not configured. Set GROQ_API_KEY.' });
    }
    const recentQuestions = await db.prepare(
      'SELECT question_text FROM smart_question_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 15'
    ).all(userId);
    const avoidTexts = (recentQuestions || []).map((r) => r.question_text).filter(Boolean);
    const { question, options, correct_index } = await groq.generateSmartQuestion(
      courseName,
      contextText.slice(0, 6500),
      lang,
      avoidTexts
    );
    const optionsJson = JSON.stringify(options || []);
    const r = await db.prepare(
      'INSERT INTO smart_question_sessions (user_id, student_course_id, question_text, options_json, correct_index) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, course.id, question, optionsJson, correct_index);
    const sessionId = r.lastInsertRowid;
    const opts = Array.isArray(options) ? options : [];
    res.json({
      type: 'mc',
      question,
      course_name: courseName,
      options: opts.map((label, i) => ({ label: String(label).slice(0, 500), value: String(i) })),
      session_id: sessionId,
    });
  } catch (e) {
    console.error('Gamification /smart-question error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});

gamificationRouter.post('/smart-question/validate', async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.body?.session_id, 10);
    const selectedIndex = req.body?.selected_index != null ? parseInt(req.body.selected_index, 10) : -1;
    if (!sessionId || selectedIndex < 0) {
      return res.status(400).json({ detail: 'Missing session_id or selected_index' });
    }
    const row = await db.prepare('SELECT id, correct_index FROM smart_question_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId);
    if (!row) return res.status(404).json({ detail: 'Not found' });
    const correct = selectedIndex === Number(row.correct_index);
    if (correct) {
      const amount = XP_SOURCES.puzzle || 15;
      await db.prepare('UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?').run(amount, userId);
      const today = new Date().toISOString().slice(0, 10);
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const challengeKeys = ['smart_question', 'quiz', 'flashcards', 'task', 'mindmap'];
      const todayKey = challengeKeys[dayOfYear % challengeKeys.length];
      if (todayKey === 'smart_question') {
        await db.prepare(`
          INSERT INTO user_daily_challenges (user_id, for_date, challenge_key, completed_at, xp_awarded)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
          ON CONFLICT (user_id, for_date) DO UPDATE SET completed_at = CURRENT_TIMESTAMP, xp_awarded = ?
        `).run(userId, today, 'smart_question', amount, amount);
      }
      const xpRow = await db.prepare('SELECT xp FROM users WHERE id = ?').get(userId);
      return res.json({ correct: true, xp_earned: amount, xp: Number(xpRow?.xp ?? 0) });
    }
    res.json({ correct: false });
  } catch (e) {
    console.error('Gamification smart-question/validate error:', e);
    res.status(500).json({ detail: e.message || 'Server error' });
  }
});
