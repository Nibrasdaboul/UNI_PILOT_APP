/**
 * Text-to-Speech API: extract text, tashkeel, AI speech (Groq Orpheus TTS).
 * Uses same GROQ_API_KEY as rest of app.
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as groq from '../ai/groq.js';

export const ttsRouter = Router();

// GET /tts/voices-ai – whether AI TTS is available and list of voices (by language)
ttsRouter.get('/voices-ai', authMiddleware, (req, res) => {
  const lang = req.query.lang === 'ar' ? 'ar' : 'en';
  const voices = lang === 'ar' ? groq.GROQ_TTS_VOICES_AR : groq.GROQ_TTS_VOICES_EN;
  res.json({
    available: groq.isConfigured(),
    voices,
  });
});

// POST /tts/speak – AI TTS (Groq Orpheus): returns { chunks: [ base64, ... ], format: 'wav' }
ttsRouter.post('/speak', authMiddleware, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    const voice = req.body?.voice || undefined;
    if (!text) return res.status(400).json({ detail: '"text" is required.' });
    if (!groq.isConfigured()) {
      return res.status(503).json({
        detail: 'AI voice requires GROQ_API_KEY. Set it in .env or server/groq-key.txt.',
      });
    }
    const buffers = await groq.getSpeechChunks(text, lang, voice);
    const chunks = buffers.map((b) => b.toString('base64'));
    res.json({ chunks, format: 'wav' });
  } catch (e) {
    if (e?.status === 401) return res.status(503).json({ detail: 'Invalid Groq API key.' });
    if (e?.status === 429) return res.status(503).json({ detail: 'AI voice rate limit. Try again later.' });
    const code = e?.error?.code || e?.body?.error?.code;
    const msg = e?.error?.message || e?.body?.error?.message || e?.message || '';
    if (e?.status === 400 && (code === 'model_terms_required' || String(msg).includes('terms acceptance'))) {
      return res.status(503).json({
        detail: 'قبل استخدام صوت الذكاء الاصطناعي يجب قبول شروط النموذج في وحدة Groq. افتح الرابط وقبل الشروط: https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english (للإنجليزي) أو https://console.groq.com/playground?model=canopylabs%2Forpheus-arabic-saudi (للعربي).',
        code: 'model_terms_required',
      });
    }
    console.error('TTS speak error:', e?.message);
    res.status(500).json({ detail: e?.message || msg || 'AI speech failed' });
  }
});

const TASHKEEL_SYSTEM = `You are an expert in Arabic diacritics (تشكيل). Given Arabic text without diacritics, return the exact same text with correct diacritics (حركات: فتحة، ضمة، كسرة، سكون، شدة، إلخ) for correct pronunciation. Preserve line breaks and structure. Output only the diacritized text, no explanations. If the input is not Arabic or is empty, return it unchanged.`;

async function extractTextFromFile(buffer) {
  const officeParser = await import('officeparser');
  const parseOffice = officeParser.default?.parseOffice ?? officeParser.parseOffice;
  if (typeof parseOffice !== 'function') throw new Error('officeparser.parseOffice not found');
  const ast = await parseOffice(buffer);
  const text = typeof ast?.toText === 'function' ? ast.toText() : (ast?.text ?? '');
  return (String(text || '')).trim();
}

// POST /tts/extract – extract text from body text or from uploaded file (base64)
ttsRouter.post('/extract', authMiddleware, async (req, res) => {
  try {
    const { text: bodyText, file_base64: fileBase64, filename } = req.body || {};
    if (bodyText != null && typeof bodyText === 'string') {
      return res.json({ text: bodyText.trim() });
    }
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ detail: 'Provide "text" or "file_base64" and "filename".' });
    }
    const buf = Buffer.from(fileBase64, 'base64');
    const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'docx', 'doc', 'pptx', 'ppt'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ detail: 'Unsupported file type. Use PDF, DOCX, or PPTX.' });
    }
    let text = '';
    try {
      text = await extractTextFromFile(buf);
    } catch (e) {
      return res.status(400).json({ detail: 'File extraction failed. ' + (e?.message || '') });
    }
    res.json({ text: text || '' });
  } catch (e) {
    console.error('TTS extract error:', e);
    res.status(500).json({ detail: e?.message || 'Extraction failed' });
  }
});

// POST /tts/tashkeel – add Arabic diacritics using AI (Groq)
ttsRouter.post('/tashkeel', authMiddleware, async (req, res) => {
  try {
    const text = req.body?.text;
    if (text == null || typeof text !== 'string') {
      return res.status(400).json({ detail: '"text" is required.' });
    }
    const trimmed = text.trim();
    if (!trimmed) return res.json({ text: '' });
    if (!groq.isConfigured()) {
      return res.status(503).json({
        detail: 'Tashkeel requires GROQ_API_KEY. Set it in .env or server/groq-key.txt.',
        text: trimmed,
      });
    }
    const diacritized = await groq.chat(
      [{ role: 'user', content: trimmed }],
      TASHKEEL_SYSTEM
    );
    res.json({ text: (diacritized || trimmed).trim() });
  } catch (e) {
    if (e?.status === 403) {
      return res.status(503).json({
        detail: 'AI unavailable for tashkeel. Check Groq API key and network/region.',
      });
    }
    console.error('TTS tashkeel error:', e?.message);
    res.status(500).json({ detail: e?.message || 'Tashkeel failed' });
  }
});
