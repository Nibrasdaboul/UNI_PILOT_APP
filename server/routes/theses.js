/**
 * Theses & research: sources (websites, YouTube, academic) and AI writing help.
 * All powered by Groq.
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as groq from '../ai/groq.js';

export const thesesRouter = Router();

function handleGroqError(e, res, fallback = 'AI request failed') {
  if (e?.status === 403) {
    return res.status(503).json({
      detail: 'AI unavailable. Check your Groq API key and network.',
    });
  }
  console.error('Theses AI error:', e?.message || e);
  return res.status(500).json({ detail: e?.message || fallback });
}

// POST /api/theses/sources – get suggested sources for a topic (websites, YouTube, academic)
thesesRouter.post('/sources', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const topic = (req.body?.topic || '').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!topic) {
      return res.status(400).json({ detail: 'topic is required' });
    }
    const result = await groq.thesesSources(topic, lang);
    res.json(result);
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate sources');
  }
});

// POST /api/theses/help – get AI guidance for research / seminar / report / thesis
thesesRouter.post('/help', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const topic = (req.body?.topic || '').trim();
    const type = (req.body?.type || 'scientific_research').trim();
    const validTypes = ['scientific_research', 'seminar', 'report', 'thesis_masters', 'thesis_phd'];
    const helpType = validTypes.includes(type) ? type : 'scientific_research';
    const extraPrompt = (req.body?.extra_prompt || '').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!topic) {
      return res.status(400).json({ detail: 'topic is required' });
    }
    const content = await groq.thesesHelp(topic, helpType, extraPrompt, lang);
    res.json({ content });
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate help');
  }
});
