import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireAiQuota } from '../middleware/requireAiQuota.js';
import { getGradeStatus } from '../lib/gradeUtils.js';
import * as groq from '../ai/groq.js';
import * as subscriptionService from '../services/subscriptionService.js';

export const aiRouter = Router();

function handleGroqError(e, res, fallbackDetail = 'AI request failed') {
  const status = e?.status;
  const code = e?.error?.code || e?.code;
  const message = (e?.error?.message || e?.message || '').toLowerCase();

  if (status === 401 || code === 'invalid_api_key' || message.includes('invalid api key')) {
    return res.status(503).json({
      detail: 'Invalid or expired Groq API key. Set a valid GROQ_API_KEY in .env (get a key at https://console.groq.com). See AI_SETUP.md.',
    });
  }
  if (status === 403) {
    return res.status(503).json({
      detail: 'AI unavailable. Check your Groq API key and network (Groq may block some regions).',
    });
  }
  console.error('AI error:', e?.message || e);
  return res.status(500).json({ detail: e?.message || fallbackDetail });
}

async function buildCoachContext(userId) {
  const user = await db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId);
  const courses = await db.prepare(`
    SELECT course_name, course_code, current_grade, credit_hours, target_grade FROM student_courses WHERE user_id = ?
  `).all(userId);
  const record = await db.prepare('SELECT cgpa, total_credits_completed FROM student_academic_record WHERE user_id = ?').get(userId);
  const tasks = await db.prepare(`
    SELECT title, due_date FROM planner_tasks WHERE user_id = ? AND completed = 0 AND due_date::date >= CURRENT_DATE ORDER BY due_date LIMIT 5
  `).all(userId);
  const name = user?.full_name || 'Student';
  const courseList = Array.isArray(courses) ? courses : [];
  const taskList = Array.isArray(tasks) ? tasks : [];
  let context = `You are UniPilot AI Coach, an expert academic assistant. The student's name is ${name}.

RULES FOR YOUR ANSWERS:
- Address EVERY part of the student's question or request. Do not skip or summarize away important points.
- Be direct and clear. Give a complete answer first, then add details or examples if useful.
- Use the same language the student uses (Arabic or English). If they write in Arabic, respond fully in Arabic.
- When explaining: structure with short paragraphs or bullet points so the answer is easy to follow.
- For study plans or strategies: give concrete, step-by-step advice the student can apply immediately.
- If the question is ambiguous, answer the most likely meaning and briefly mention other interpretations if relevant.`;
  if (courseList.length) {
    context += `\nTheir courses: ${courseList.map((c) => `${c.course_name} (${c.course_code})${c.current_grade != null ? ', grade: ' + c.current_grade + '%' : ''}${c.target_grade != null ? ', target: ' + c.target_grade + '%' : ''}`).join('; ')}.`;
  }
  if (record) {
    context += `\nCGPA: ${Number(record.cgpa || 0).toFixed(2)}; credits completed: ${record.total_credits_completed || 0}.`;
  }
  if (taskList.length) {
    context += `\nUpcoming tasks: ${taskList.map((t) => t.title + ' (' + t.due_date + ')').join('; ')}.`;
  }
  context += '\nAlways respond in a helpful, complete way that fully satisfies what the student asked.';
  return context;
}

// GET /api/ai/conversations – list coach conversation history
aiRouter.get('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const rows = await db.prepare(`
    SELECT id, title, created_at, updated_at
    FROM ai_chat_sessions
    WHERE user_id = ?
    ORDER BY COALESCE(updated_at, created_at) DESC
  `).all(userId);
  const list = rows.map((r) => ({
    id: r.id,
    title: r.title || (r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Chat'),
    created_at: r.created_at,
    updated_at: r.updated_at || r.created_at,
  }));
  res.json(list);
});

// GET /api/ai/conversations/:id – get one conversation with messages
aiRouter.get('/conversations/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const session = await db.prepare('SELECT id, title, created_at, updated_at FROM ai_chat_sessions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!session) return res.status(404).json({ detail: 'Not found' });
  const msgs = await db.prepare('SELECT id, role, content, created_at FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC').all(id);
  const messages = msgs.map((m) => ({ id: m.id, role: m.role, content: m.content }));
  res.json({ id: session.id, title: session.title, created_at: session.created_at, updated_at: session.updated_at, messages });
});

// POST /api/ai/conversations – create new conversation (optional title and initial messages)
aiRouter.post('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const title = (req.body?.title || '').trim().slice(0, 200) || null;
  const now = new Date().toISOString();
  const r = await db.prepare('INSERT INTO ai_chat_sessions (user_id, title, updated_at) VALUES (?, ?, ?)').run(userId, title, now);
  const sessionId = r.lastInsertRowid;
  res.status(201).json({ id: sessionId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [] });
});

// PATCH /api/ai/conversations/:id – update title and/or append messages
aiRouter.patch('/conversations/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await db.prepare('SELECT id FROM ai_chat_sessions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ detail: 'Not found' });
  const b = req.body || {};
  if (b.title !== undefined) {
    const title = (b.title || '').trim().slice(0, 200) || null;
    await db.prepare('UPDATE ai_chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, id);
  }
  if (Array.isArray(b.messages) && b.messages.length > 0) {
    for (const m of b.messages) {
      const role = m.role === 'user' ? 'user' : 'assistant';
      const content = (m.content || '').trim();
      if (content) await db.prepare('INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(id, role, content);
    }
    await db.prepare('UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  }
  const updated = await db.prepare('SELECT id, title, created_at, updated_at FROM ai_chat_sessions WHERE id = ?').get(id);
  const msgs = await db.prepare('SELECT id, role, content FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC').all(id);
  res.json({ id: updated.id, title: updated.title, created_at: updated.created_at, updated_at: updated.updated_at, messages: msgs.map((m) => ({ id: m.id, role: m.role, content: m.content })) });
});

// DELETE /api/ai/conversations/:id
aiRouter.delete('/conversations/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const r = await db.prepare('DELETE FROM ai_chat_sessions WHERE id = ? AND user_id = ?').run(id, req.user.id);
  if (r.changes === 0) return res.status(404).json({ detail: 'Not found' });
  res.status(204).send();
});

// POST /api/ai/chat – global AI coach chat (optional conversation_id to append to history)
aiRouter.post('/chat', authMiddleware, requireAiQuota, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const userId = req.user.id;
    const { messages, conversation_id } = req.body || {};
    const list = Array.isArray(messages) && messages.length ? messages : [];
    const lastUser = list.filter((m) => m.role === 'user').pop();
    if (!lastUser?.content?.trim()) {
      return res.status(400).json({ detail: 'messages with at least one user message required' });
    }
    const systemContext = await buildCoachContext(userId);
    const reply = await groq.chat(list, systemContext);
    await subscriptionService.incrementAiUsage(userId, 'ai_chat', 1000);
    await subscriptionService.logAiRequest(userId, 'ai_chat', 'groq', 1000);
    const out = { content: reply };
    if (conversation_id != null) {
      const cid = parseInt(conversation_id, 10);
      const session = await db.prepare('SELECT id FROM ai_chat_sessions WHERE id = ? AND user_id = ?').get(cid, userId);
      if (session) {
        await db.prepare('INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(cid, 'user', lastUser.content.trim());
        await db.prepare('INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(cid, 'assistant', reply);
        const firstTitle = await db.prepare('SELECT title FROM ai_chat_sessions WHERE id = ?').get(cid);
        if (!firstTitle?.title) {
          const title = lastUser.content.trim().slice(0, 80);
          await db.prepare('UPDATE ai_chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, cid);
        } else {
          await db.prepare('UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cid);
        }
        out.conversation_id = cid;
      }
    }
    res.json(out);
  } catch (e) {
    return handleGroqError(e, res, 'AI request failed');
  }
});

// POST /api/ai/course_chat – course-specific chat
aiRouter.post('/course_chat', authMiddleware, requireAiQuota, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const userId = req.user.id;
    const courseId = parseInt(req.body?.course_id, 10);
    const content = (req.body?.content || '').trim();
    if (!content || !Number.isFinite(courseId)) {
      return res.status(400).json({ detail: 'course_id and content required' });
    }
    const course = await db.prepare('SELECT id, course_name, course_code, description FROM student_courses WHERE id = ? AND user_id = ?').get(courseId, userId);
    if (!course) return res.status(404).json({ detail: 'Course not found' });
    const systemContext = `You are UniPilot AI Coach helping with the course "${course.course_name}" (${course.course_code}). ${course.description ? 'Course description: ' + course.description.slice(0, 500) : ''} Answer only about this course and study advice. Use the same language as the student (Arabic or English).`;
    const reply = await groq.chat([{ role: 'user', content }], systemContext);
    await subscriptionService.incrementAiUsage(userId, 'course_chat', 800);
    await subscriptionService.logAiRequest(userId, 'course_chat', 'groq', 800);
    res.json({ content: reply });
  } catch (e) {
    return handleGroqError(e, res, 'AI request failed');
  }
});

// POST /api/ai/summarize
aiRouter.post('/summarize', authMiddleware, requireAiQuota, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const text = (req.body?.text || '').trim();
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    if (!text) return res.status(400).json({ detail: 'text required' });
    const summary = await groq.summarize(text, lang);
    const userId = req.user.id;
    await subscriptionService.incrementAiUsage(userId, 'summarize', 500);
    await subscriptionService.logAiRequest(userId, 'summarize', 'groq', 500);
    res.json({ summary: summary || '' });
  } catch (e) {
    return handleGroqError(e, res, 'AI request failed');
  }
});

// POST /api/ai/generate_flashcards
aiRouter.post('/generate_flashcards', authMiddleware, requireAiQuota, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const text = (req.body?.text || '').trim();
    const count = Math.min(20, Math.max(1, parseInt(req.body?.count, 10) || 5));
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    if (!text) return res.status(400).json({ detail: 'text required' });
    const flashcards = await groq.generateFlashcards(text, count, lang);
    const userId = req.user.id;
    await subscriptionService.incrementAiUsage(userId, 'generate_flashcards', 800);
    await subscriptionService.logAiRequest(userId, 'generate_flashcards', 'groq', 800);
    res.json({ flashcards });
  } catch (e) {
    return handleGroqError(e, res, 'AI request failed');
  }
});

// POST /api/ai/generate_quiz
aiRouter.post('/generate_quiz', authMiddleware, requireAiQuota, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const text = (req.body?.text || '').trim();
    const count = Math.min(10, Math.max(1, parseInt(req.body?.count, 10) || 3));
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    if (!text) return res.status(400).json({ detail: 'text required' });
    const quiz = await groq.generateQuiz(text, count, lang);
    const userId = req.user.id;
    await subscriptionService.incrementAiUsage(userId, 'generate_quiz', 1000);
    await subscriptionService.logAiRequest(userId, 'generate_quiz', 'groq', 1000);
    res.json({ quiz });
  } catch (e) {
    return handleGroqError(e, res, 'AI request failed');
  }
});

// GET /api/ai/next-semester-suggestions – suggest catalog courses for next semester (optional: target_hours); consider prereq grades and include carried (failed) courses
const PREREQ_MIN_GRADE = 60; // do not suggest a course if student's grade in its prerequisite was below this

aiRouter.get('/next-semester-suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const targetHours = req.query.target_hours != null ? parseInt(req.query.target_hours, 10) : null;

    const completed = await db.prepare(`
      SELECT catalog_course_id, course_name, course_code, current_grade, passed
      FROM student_courses WHERE user_id = ? AND finalized_at IS NOT NULL AND catalog_course_id IS NOT NULL
    `).all(userId);
    const completedList = Array.isArray(completed) ? completed : [];
    const passedCatalogIds = new Set(completedList.filter((c) => c.passed === 1).map((c) => c.catalog_course_id));
    const gradeByCatalogId = Object.fromEntries(
      completedList.map((c) => [c.catalog_course_id, c.current_grade != null ? Number(c.current_grade) : null])
    );

    const carried = await db.prepare(`
      SELECT id, catalog_course_id, course_name, course_code, credit_hours
      FROM student_courses WHERE user_id = ? AND finalized_at IS NOT NULL AND (passed = 0 OR passed IS NULL) AND (withdrawn != 1 OR withdrawn IS NULL) AND catalog_course_id IS NOT NULL
    `).all(userId);
    const carriedList = Array.isArray(carried) ? carried : [];
    const carriedTotalHours = carriedList.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
    const carriedCatalogIds = new Set(carriedList.map((c) => c.catalog_course_id).filter(Boolean));

    const catalog = await db.prepare(`
      SELECT id, course_code, course_name, department, credit_hours, prerequisite_id, "order"
      FROM catalog_courses ORDER BY "order" ASC, id ASC
    `).all();
    const catalogList = Array.isArray(catalog) ? catalog : [];
    const canTakeNew = catalogList.filter((c) => {
      if (passedCatalogIds.has(c.id)) return false;
      if (carriedCatalogIds.has(c.id)) return false;
      if (c.prerequisite_id == null) return true;
      if (!passedCatalogIds.has(c.prerequisite_id)) return false;
      const prereqGrade = gradeByCatalogId[c.prerequisite_id];
      if (prereqGrade != null && prereqGrade < PREREQ_MIN_GRADE) return false;
      return true;
    });

    const completedWithGrade = completedList.map((c) => ({ id: c.catalog_course_id, name: c.course_name, grade: c.current_grade }));
    const lang = req.query.lang === 'ar' ? 'ar' : 'en';

    const carriedForResponse = carriedList.map((c) => ({
      id: c.catalog_course_id || c.id,
      course_id: c.catalog_course_id || c.id,
      course_name: c.course_name,
      course_code: c.course_code,
      credit_hours: Number(c.credit_hours) || 0,
      reason: lang === 'ar' ? 'مادة محمولة (إعادة تسجيل)' : 'Carried (retake)',
      carried: true,
    }));

    if (canTakeNew.length === 0 && carriedList.length === 0) {
      return res.json({ suggestions: [], total_hours: 0, message: 'No new courses available; complete more prerequisites or add catalog courses.' });
    }

    if (groq.isConfigured() && targetHours != null && targetHours > 0) {
      const remainingHours = Math.max(0, targetHours - carriedTotalHours);
      let selectedNew = exactSubsetSum(canTakeNew, remainingHours);
      if (selectedNew.length === 0 && remainingHours > 0) {
        selectedNew = selectCoursesToMatchHours(canTakeNew, remainingHours);
      }
      const newTotal = selectedNew.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
      const totalSuggested = carriedTotalHours + newTotal;
      const withReason = selectedNew.map((c) => ({
        id: c.id,
        course_id: c.id,
        course_name: c.course_name,
        course_code: c.course_code,
        credit_hours: Number(c.credit_hours) || 0,
        reason: lang === 'ar' ? 'مقترح حسب عدد الساعات' : 'Suggested to match target hours',
        carried: false,
      }));
      return res.json({
        suggestions: [...carriedForResponse, ...withReason],
        total_hours: totalSuggested,
        target_hours: targetHours,
        from_ai: false,
        exact_match: newTotal === remainingHours,
      });
    }

    if (groq.isConfigured()) {
      const coursesForPrompt = [...canTakeNew];
      const prompt = lang === 'ar'
        ? `الطالب أنهى هذه المواد مع العلامات: ${completedWithGrade.map((c) => `${c.name}: ${c.grade != null ? c.grade + '%' : '—'}`).join('؛ ')}. المواد المحمولة (يجب إعادة تسجيلها): ${carriedList.map((c) => c.course_name + ' (' + c.course_code + ')').join('؛ ')}. المواد الجديدة المتاحة (المتطلب نال فيه الطالب علامة جيدة): ${coursesForPrompt.map((c) => c.course_name + ' (' + c.course_code + ')').join('؛ ')}. رتّب أفضل 10 مواد ينصح بتسجيلها للفصل القادم (تضمين المحمولة) مع سبب قصير لكل مادة. أعد الجواب كـ JSON array: [{"course_id": number, "course_name": string, "reason_ar": string}]`
        : `Student completed: ${completedWithGrade.map((c) => `${c.name}: ${c.grade != null ? c.grade + '%' : '—'}`).join('; ')}. Carried courses (must retake): ${carriedList.map((c) => c.course_name + ' (' + c.course_code + ')').join('; ')}. Available new courses (prereq grade sufficient): ${coursesForPrompt.map((c) => c.course_name + ' (' + c.course_code + ')').join('; ')}. Rank top 10 courses to suggest for next semester (include carried) with a short reason for each. Reply with JSON array only: [{"course_id": number, "course_name": string, "reason": string}]`;
      const raw = await groq.chat([{ role: 'user', content: prompt }], 'You output only valid JSON array. No markdown, no explanation.');
      const cleaned = (raw || '[]').replace(/^```json?\s*|\s*```$/g, '').trim();
      let suggested = [];
      try {
        suggested = JSON.parse(cleaned);
        if (!Array.isArray(suggested)) suggested = [];
      } catch (_) {}
      const byIdNew = Object.fromEntries(canTakeNew.map((c) => [c.id, c]));
      const byIdCarried = Object.fromEntries(carriedList.map((c) => [c.catalog_course_id || c.id, c]));
      const ordered = suggested
        .filter((s) => byIdNew[s.course_id] || byIdCarried[s.course_id])
        .slice(0, 10)
        .map((s) => {
          const fromNew = byIdNew[s.course_id];
          const fromCarried = byIdCarried[s.course_id];
          const c = fromNew || fromCarried;
          if (!c) return null;
          const hours = Number(c.credit_hours) || 0;
          return {
            id: c.id,
            course_id: c.catalog_course_id || c.id,
            course_name: c.course_name,
            course_code: c.course_code,
            credit_hours: hours,
            reason: s.reason || s.reason_ar || '',
            carried: !!fromCarried,
          };
        })
        .filter(Boolean);
      const rest = canTakeNew.filter((c) => !ordered.find((o) => o.course_id === c.id)).slice(0, 20);
      const restMapped = rest.map((c) => ({
        id: c.id,
        course_id: c.id,
        course_name: c.course_name,
        course_code: c.course_code,
        credit_hours: Number(c.credit_hours) || 0,
        reason: '',
        carried: false,
      }));
      const list = [...carriedForResponse, ...ordered.filter((o) => !o.carried), ...restMapped].filter((x, i, arr) => arr.findIndex((y) => (y.course_id || y.id) === (x.course_id || x.id)) === i).slice(0, 15);
      const totalH = list.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
      return res.json({ suggestions: list, total_hours: totalH, from_ai: true });
    }

    const list = [...carriedForResponse, ...canTakeNew.slice(0, 15 - carriedForResponse.length)].map((c, i) => ({
      id: c.course_id ?? c.id,
      course_id: c.course_id ?? c.id,
      course_name: c.course_name,
      course_code: c.course_code,
      credit_hours: Number(c.credit_hours) || 0,
      reason: c.reason || '',
      carried: !!c.carried,
    }));
    const totalH = list.reduce((s, c) => s + (Number(c.credit_hours) || 0), 0);
    return res.json({ suggestions: list, total_hours: totalH, from_ai: false });
  } catch (e) {
    return handleGroqError(e, res, 'Suggestions failed');
  }
});

function exactSubsetSum(courses, targetHours) {
  const withH = courses.map((c) => ({ ...c, h: Number(c.credit_hours) || 0 })).filter((c) => c.h > 0);
  if (targetHours <= 0 || withH.length === 0) return [];
  const result = [];
  function dfs(i, sum, path) {
    if (sum === targetHours) return path;
    if (i >= withH.length || sum > targetHours) return null;
    const take = dfs(i + 1, sum + withH[i].h, [...path, withH[i]]);
    if (take) return take;
    return dfs(i + 1, sum, path);
  }
  return dfs(0, 0, []) || [];
}

function selectCoursesToMatchHours(canTake, targetHours) {
  const withHours = canTake.map((c) => ({ ...c, h: Number(c.credit_hours) || 0 })).filter((c) => c.h > 0);
  if (withHours.length === 0 || targetHours <= 0) return [];
  const sorted = [...withHours].sort((a, b) => b.h - a.h);
  const result = [];
  let sum = 0;
  for (const c of sorted) {
    if (sum + c.h <= targetHours) {
      result.push(c);
      sum += c.h;
      if (sum === targetHours) return result;
    }
  }
  if (sum < targetHours) {
    const remaining = targetHours - sum;
    const small = sorted.filter((c) => !result.includes(c) && c.h <= remaining).sort((a, b) => b.h - a.h);
    for (const c of small) {
      if (sum + c.h <= targetHours) {
        result.push(c);
        sum += c.h;
        if (sum === targetHours) return result;
      }
    }
  }
  return result;
}

const GUIDE_SYSTEM_EN =
  'You are the UniPilot User Guide assistant. Answer only questions about how to use the UniPilot app. Explain briefly: Dashboard, Courses, Academic History, Planner, AI Coach, Analytics, Study Tools (summarizer, flashcards, quiz, mind map, voice-to-text, translate video, text-to-speech, infographics, theses), Notes, Subject Tree, Settings. Be concise and friendly. If the user asks something unrelated to the app, say you can only help with UniPilot usage.';
const GUIDE_SYSTEM_AR =
  'أنت مساعد دليل مستخدم يوني بايلوت. أجب فقط عن كيفية استخدام تطبيق يوني بايلوت. اشرح باختصار: لوحة التحكم، المقررات، السجل الأكاديمي، المخطط، المستشار الذكي، التحليلات، أدوات الدراسة (الملخص، البطاقات، الاختبار، الخريطة الذهنية، الصوت لنص، ترجمة الفيديو، النص لصوت، الانفوغرافيك، الرسائل)، الملاحظات، شجرة المواد، الإعدادات. كن موجزاً وودوداً. إن سأل المستخدم عن شيء خارج التطبيق فقل إنك تساعد فقط في استخدام يوني بايلوت.';

// POST /api/ai/guide-chat – user guide chatbot (no persistence)
aiRouter.post('/guide-chat', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const { messages } = req.body || {};
    const list = Array.isArray(messages) && messages.length ? messages : [];
    const lastUser = list.filter((m) => m.role === 'user').pop();
    if (!lastUser?.content?.trim()) {
      return res.status(400).json({ detail: 'messages with at least one user message required' });
    }
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const systemContext = lang === 'ar' ? GUIDE_SYSTEM_AR : GUIDE_SYSTEM_EN;
    const reply = await groq.chat(list, systemContext);
    res.json({ content: reply });
  } catch (e) {
    return handleGroqError(e, res, 'Guide chat failed');
  }
});

