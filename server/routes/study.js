/**
 * Study Tools API: upload, summarize, flashcards, quiz, mind map.
 * All persisted to DB. AI via groq.
 * Supports PDF, DOC, DOCX, PPT, PPTX, TXT with Arabic text.
 */
import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import * as groq from '../ai/groq.js';

export const studyRouter = Router();

/** Remove null bytes (0x00) - PostgreSQL TEXT cannot store them. Use byte-level strip so it always works. */
function stripNullBytes(s) {
  if (s == null || typeof s !== 'string') return '';
  try {
    const buf = Buffer.from(s, 'utf8');
    const filtered = Buffer.alloc(buf.length);
    let j = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] !== 0x00) filtered[j++] = buf[i];
    }
    return Buffer.from(filtered.subarray(0, j)).toString('utf8');
  } catch {
    return s.replace(/\0/g, '');
  }
}

async function getTextFromBody(req, res) {
  const userId = req.user.id;
  const text = (req.body?.text || '').trim();
  const documentId = req.body?.document_id != null ? parseInt(req.body.document_id, 10) : null;
  if (text) return text;
  if (documentId) {
    const doc = await db.prepare('SELECT extracted_text FROM study_documents WHERE id = ? AND user_id = ?').get(documentId, userId);
    if (!doc) {
      res.status(404).json({ detail: 'Document not found' });
      return null;
    }
    return stripNullBytes((doc.extracted_text || '').trim());
  }
  res.status(400).json({ detail: 'text or document_id required' });
  return null;
}

// POST /study/upload – upload file as base64, extract text (txt, pdf, doc, docx, ppt, pptx), save document
// Supports Arabic (UTF-8). Uses Buffer when possible to avoid temp file issues on Windows.
studyRouter.post('/upload', authMiddleware, async (req, res) => {
  let tempPath = null;
  try {
    const userId = req.user.id;
    const b64 = req.body?.file_base64;
    const rawFilename = (req.body?.filename || 'file.txt').trim();
    const filename = stripNullBytes(rawFilename) || 'file.txt';
    if (!b64 || typeof b64 !== 'string') {
      return res.status(400).json({ detail: 'file_base64 required' });
    }
    let extracted = '';
    const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const buf = Buffer.from(b64, 'base64');

    if (ext === 'txt' || ext === 'text' || !ext) {
      try {
        let raw = buf.toString('utf-8');
        if (raw.length && raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
        extracted = raw;
      } catch {
        try {
          extracted = buf.toString('utf16le');
        } catch {
          extracted = buf.toString('latin1');
        }
      }
    } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
      try {
        const officeparser = await import('officeparser');
        const parseOffice = officeparser.default?.parseOffice ?? officeparser.parseOffice;
        if (typeof parseOffice === 'function') {
          const ast = await parseOffice(buf);
          if (ast && typeof ast.toText === 'function') {
            extracted = ast.toText();
          } else if (ast && typeof ast.text === 'string') {
            extracted = ast.text;
          } else if (ast && ast.content != null) {
            const c = ast.content;
            if (typeof c === 'string') extracted = c;
            else if (Array.isArray(c)) extracted = c.map((p) => (p && p.text) || '').join('\n\n');
            else extracted = (c.text ?? '') || '';
          }
          if (typeof extracted !== 'string') extracted = extracted ? String(extracted) : '';
        }
      } catch (e) {
        console.warn('Office/PDF parse error:', e?.message);
        if (ext === 'pdf') {
          try {
            const pdfMod = await import('pdf-parse');
            const pdfParse = pdfMod.default ?? pdfMod;
            if (typeof pdfParse === 'function') {
              const data = await pdfParse(buf);
              extracted = (data && data.text) ? String(data.text).trim() : '';
            }
          } catch (e2) {
            console.warn('pdf-parse fallback error:', e2?.message);
          }
        }
        if (!extracted && ['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
          const { writeFileSync, unlinkSync } = await import('fs');
          const { join } = await import('path');
          const { tmpdir } = await import('os');
          const safeName = `study_${Date.now()}.${ext}`;
          tempPath = join(tmpdir(), safeName);
          try {
            writeFileSync(tempPath, buf);
            const op = await import('officeparser');
            const parseOffice = op.default?.parseOffice ?? op.parseOffice;
            if (typeof parseOffice === 'function') {
              const ast2 = await parseOffice(tempPath);
              if (ast2 && typeof ast2.toText === 'function') extracted = ast2.toText();
            }
          } finally {
            if (tempPath) try { unlinkSync(tempPath); } catch (_) {}
            tempPath = null;
          }
        }
      }
    }

    if (!extracted || (typeof extracted === 'string' && extracted.trim() === '')) {
      const isPdfOrOffice = ext === 'pdf' || ['doc', 'docx', 'ppt', 'pptx'].includes(ext);
      return res.status(400).json({
        detail: isPdfOrOffice
          ? 'No text could be extracted from this file. The file may be scanned (image-only), corrupted, or in an unsupported format. Try a text-based PDF or paste the text manually.'
          : 'No text could be extracted.',
      });
    }

    extracted = stripNullBytes(extracted);
    const safeFilename = stripNullBytes(filename) || 'document';

    let r;
    try {
      r = await db.prepare(
        'INSERT INTO study_documents (user_id, filename, file_type, extracted_text) VALUES (?, ?, ?, ?)'
      ).run(userId, safeFilename, ext || 'txt', extracted);
    } catch (insertErr) {
      const msg = insertErr?.message || '';
      if (msg.includes('0x00') || msg.includes('UTF8') || msg.includes('encoding')) {
        const buf = Buffer.from(extracted, 'utf8');
        const arr = [];
        for (let i = 0; i < buf.length; i++) {
          if (buf[i] !== 0x00) arr.push(buf[i]);
        }
        extracted = Buffer.from(arr).toString('utf8');
        r = await db.prepare(
          'INSERT INTO study_documents (user_id, filename, file_type, extracted_text) VALUES (?, ?, ?, ?)'
        ).run(userId, safeFilename, ext || 'txt', extracted);
      } else {
        throw insertErr;
      }
    }
    const id = r.lastInsertRowid;
    res.status(201).json({ document_id: id, text: extracted, filename: safeFilename });
  } catch (e) {
    if (tempPath) {
      try { const { unlinkSync } = await import('fs'); unlinkSync(tempPath); } catch (_) {}
    }
    console.error('Study upload error:', e);
    res.status(500).json({ detail: e.message || 'Upload failed' });
  }
});

// GET /study/documents?search=
studyRouter.get('/documents', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT id, filename, file_type, created_at FROM study_documents WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  if (search) {
    rows = rows.filter((r) => (r.filename || '').toLowerCase().includes(search));
  }
  res.json(rows);
});

// POST /study/summarize – AI summarize, save, return
studyRouter.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const text = await getTextFromBody(req, res);
    if (text == null) return;
    if (!groq.isConfigured()) return res.status(503).json({ detail: 'AI not configured' });
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const summary = await groq.summarize(text, lang);
    const userId = req.user.id;
    const title = (summary || '').slice(0, 200);
    const r = await db.prepare(
      'INSERT INTO study_summaries (user_id, source_type, title, content, lang) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'text', title, summary || '', lang);
    const id = r.lastInsertRowid;
    res.status(201).json({ id, summary: summary || '' });
  } catch (e) {
    if (e?.status === 403) return res.status(503).json({ detail: 'AI unavailable. Check Groq API key and network/region.' });
    console.error('Study summarize error:', e?.message);
    res.status(500).json({ detail: e?.message || 'Summarize failed' });
  }
});

// GET /study/summaries?search=
studyRouter.get('/summaries', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT id, title, content, lang, created_at FROM study_summaries WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  if (search) {
    rows = rows.filter((r) => (r.title || '').toLowerCase().includes(search) || (r.content || '').toLowerCase().includes(search));
  }
  res.json(rows.map((r) => ({ id: r.id, title: r.title, content: r.content, lang: r.lang, created_at: r.created_at })));
});

// GET /study/summaries/:id
studyRouter.get('/summaries/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await db.prepare('SELECT id, title, content, lang, created_at FROM study_summaries WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  res.json(row);
});

// POST /study/flashcards – AI generate, save set + cards, return
studyRouter.post('/flashcards', authMiddleware, async (req, res) => {
  try {
    const text = await getTextFromBody(req, res);
    if (text == null) return;
    if (!groq.isConfigured()) return res.status(503).json({ detail: 'AI not configured' });
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const count = Math.min(50, Math.max(1, parseInt(req.body?.count, 10) || 10));
    const cards = await groq.generateFlashcards(text, count, lang);
    const userId = req.user.id;
    const rSet = await db.prepare('INSERT INTO study_flashcard_sets (user_id, source_type, title, lang) VALUES (?, ?, ?, ?)').run(userId, 'text', (text.slice(0, 100) || 'Flashcards'), lang);
    const setId = rSet.lastInsertRowid;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      await db.prepare('INSERT INTO study_flashcards (set_id, front, back, sort_order) VALUES (?, ?, ?, ?)').run(setId, c.front || '', c.back || '', i);
    }
    const list = await db.prepare('SELECT id, front, back, sort_order FROM study_flashcards WHERE set_id = ? ORDER BY sort_order').all(setId);
    res.status(201).json({ set_id: setId, flashcards: list.map((c) => ({ id: c.id, front: c.front, back: c.back })) });
  } catch (e) {
    if (e?.status === 403) return res.status(503).json({ detail: 'AI unavailable. Check Groq API key and network/region.' });
    console.error('Study flashcards error:', e?.message);
    res.status(500).json({ detail: e?.message || 'Flashcards failed' });
  }
});

// GET /study/flashcards/sets?search=
studyRouter.get('/flashcards/sets', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT id, title, lang, created_at FROM study_flashcard_sets WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  if (search) {
    rows = rows.filter((r) => (r.title || '').toLowerCase().includes(search));
  }
  res.json(rows);
});

// GET /study/flashcards/sets/:id
studyRouter.get('/flashcards/sets/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const set = await db.prepare('SELECT id, title, lang, created_at FROM study_flashcard_sets WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!set) return res.status(404).json({ detail: 'Not found' });
  const cards = await db.prepare('SELECT id, front, back, sort_order FROM study_flashcards WHERE set_id = ? ORDER BY sort_order').all(id);
  res.json({ ...set, flashcards: cards });
});

// POST /study/quiz – AI generate with options, save, return
studyRouter.post('/quiz', authMiddleware, async (req, res) => {
  try {
    const text = await getTextFromBody(req, res);
    if (text == null) return;
    if (!groq.isConfigured()) return res.status(503).json({ detail: 'AI not configured' });
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const count = Math.min(50, Math.max(1, parseInt(req.body?.count, 10) || 10));
    const difficulty = ['very_hard', 'hard', 'medium', 'easy'].includes(req.body?.difficulty) ? req.body.difficulty : 'medium';
    const questionType = ['multiple_choice', 'true_false', 'fill_blank', 'short_answer'].includes(req.body?.question_type) ? req.body.question_type : 'multiple_choice';
    const sourceScope = req.body?.source_scope === 'beyond' ? 'beyond' : 'within';
    const questions = await groq.generateQuizAdvanced(text, count, difficulty, questionType, sourceScope, lang);
    const userId = req.user.id;
    const questionsJson = JSON.stringify(questions);
    const rQuiz = await db.prepare(
      'INSERT INTO study_quizzes (user_id, source_type, title, difficulty, question_type, question_count, source_scope, lang, questions_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, 'text', (text.slice(0, 150) || 'Quiz'), difficulty, questionType, questions.length, sourceScope, lang, questionsJson);
    const id = rQuiz.lastInsertRowid;
    res.status(201).json({ id, quiz: questions, difficulty, question_type: questionType, source_scope: sourceScope });
  } catch (e) {
    if (e?.status === 403) return res.status(503).json({ detail: 'AI unavailable. Check Groq API key and network/region.' });
    console.error('Study quiz error:', e?.message);
    res.status(500).json({ detail: e?.message || 'Quiz failed' });
  }
});

// GET /study/quizzes?search=
studyRouter.get('/quizzes', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT id, title, difficulty, question_type, question_count, source_scope, lang, created_at FROM study_quizzes WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  if (search) {
    rows = rows.filter((r) => (r.title || '').toLowerCase().includes(search));
  }
  res.json(rows);
});

// GET /study/quizzes/:id
studyRouter.get('/quizzes/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await db.prepare('SELECT id, title, difficulty, question_type, question_count, source_scope, lang, questions_json, created_at FROM study_quizzes WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  const questions = JSON.parse(row.questions_json || '[]');
  res.json({ id: row.id, title: row.title, difficulty: row.difficulty, question_type: row.question_type, source_scope: row.source_scope, lang: row.lang, questions, created_at: row.created_at });
});

// POST /study/quizzes/:id/submit – score + AI feedback, save attempt, create exam_insight note + optional planner task
studyRouter.post('/quizzes/:id/submit', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const quiz = await db.prepare('SELECT id, title, questions_json, question_count FROM study_quizzes WHERE id = ? AND user_id = ?').get(id, userId);
    if (!quiz) return res.status(404).json({ detail: 'Not found' });
    const questions = JSON.parse(quiz.questions_json || '[]');
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    let score = 0;
    const results = questions.map((q, i) => {
      const userIdx = answers[i] != null ? parseInt(answers[i], 10) : -1;
      const correct = userIdx === q.correct_index;
      if (correct) score += 1;
      return { question: q.question, user_answer_index: userIdx, correct_index: q.correct_index, correct, explanation: q.explanation || '' };
    });
    const max = questions.length;
    let feedbackText = '';
    if (groq.isConfigured()) {
      try {
        const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
        const prompt = lang === 'ar'
          ? `الطالب حصل على ${score}/${max} في اختبار. اعطِ رأياً مختصراً (2-3 جمل) لتشجيعه وتحديد نقاط التحسين.`
          : `The student scored ${score}/${max} on a quiz. Give a short 2-3 sentence feedback to encourage and suggest improvement.`;
        feedbackText = await groq.chat([{ role: 'user', content: prompt }], 'You are UniPilot study coach. Reply only with the feedback.');
      } catch (_) {}
    }
    await db.prepare(
      'INSERT INTO study_quiz_attempts (user_id, quiz_id, answers_json, score_real, score_max, feedback_text) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, id, JSON.stringify(answers), score, max, feedbackText);

    if (groq.isConfigured() && results.length > 0) {
      try {
        const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
        const { content: insightContent, suggestedTopic } = await groq.generateExamInsight(
          quiz.title || 'اختبار',
          questions,
          results,
          lang
        );
        const noteCategory = 'exam_insight';
        const refType = 'quiz';
        const insightText = insightContent || '';
        await db.prepare(
          `INSERT INTO notes (user_id, student_course_id, content, type, note_category, ref_id, ref_type) VALUES (?, NULL, ?, 'app', ?, ?, ?)`
        ).run(userId, insightText, noteCategory, id, refType);

        try {
          const notifTitle =
            lang === 'ar'
              ? `تحليل أداء لاختبار: ${quiz.title || 'اختبار'}`
              : `Exam performance insight: ${quiz.title || 'Quiz'}`;
          const body = insightText.slice(0, 600);
          const type = score / (max || 1) < 0.6 ? 'warning' : 'info';
          await db.prepare(
            'INSERT INTO notifications (user_id, title, body, type, link, source) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(userId, notifTitle, body, type, '/study-tools', 'exam_insight');
        } catch (_) {}
        if (suggestedTopic && suggestedTopic.length > 0) {
          const due = new Date();
          due.setDate(due.getDate() + 3);
          const dueStr = due.toISOString().slice(0, 10);
          const taskTitle = lang === 'ar' ? `مراجعة: ${suggestedTopic}` : `Review: ${suggestedTopic}`;
          try {
            await db.prepare(
              `INSERT INTO planner_tasks (user_id, student_course_id, title, due_date, priority, source) VALUES (?, NULL, ?, ?, 2, 'app')`
            ).run(userId, taskTitle, dueStr);
          } catch (_) {}
        }
      } catch (err) {
        console.warn('Exam insight note failed:', err?.message);
      }
    }

    res.json({ score, max, feedback: feedbackText, results });
  } catch (e) {
    console.error('Study quiz submit error:', e);
    res.status(500).json({ detail: e.message || 'Submit failed' });
  }
});

// POST /study/mindmap – AI mind map, save, return
studyRouter.post('/mindmap', authMiddleware, async (req, res) => {
  try {
    const text = await getTextFromBody(req, res);
    if (text == null) return;
    if (!groq.isConfigured()) return res.status(503).json({ detail: 'AI not configured' });
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const mindMap = await groq.generateMindMap(text, lang);
    const userId = req.user.id;
    const contentJson = JSON.stringify(mindMap);
    const rMap = await db.prepare(
      'INSERT INTO study_mind_maps (user_id, source_type, title, content_json, lang) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'text', (mindMap.label || 'Mind map').slice(0, 200), contentJson, lang);
    const id = rMap.lastInsertRowid;
    res.status(201).json({ id, mind_map: mindMap });
  } catch (e) {
    if (e?.status === 403) return res.status(503).json({ detail: 'AI unavailable. Check Groq API key and network/region.' });
    console.error('Study mindmap error:', e?.message);
    res.status(500).json({ detail: e?.message || 'Mind map failed' });
  }
});

// GET /study/mindmaps?search=
studyRouter.get('/mindmaps', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const search = (req.query.search || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT id, title, lang, created_at FROM study_mind_maps WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  if (search) {
    rows = rows.filter((r) => (r.title || '').toLowerCase().includes(search));
  }
  res.json(rows);
});

// GET /study/mindmaps/:id
studyRouter.get('/mindmaps/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await db.prepare('SELECT id, title, content_json, lang, created_at FROM study_mind_maps WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!row) return res.status(404).json({ detail: 'Not found' });
  const content = JSON.parse(row.content_json || '{}');
  res.json({ id: row.id, title: row.title, mind_map: content, lang: row.lang, created_at: row.created_at });
});
