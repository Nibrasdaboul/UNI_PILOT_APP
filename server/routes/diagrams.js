/**
 * Diagrams & Infographics: from lecture/text, custom topic (e.g. roadmap), infographic data.
 * All powered by Groq.
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as groq from '../ai/groq.js';

export const diagramsRouter = Router();

function handleGroqError(e, res, fallback = 'AI request failed') {
  if (e?.status === 403) {
    return res.status(503).json({ detail: 'AI unavailable. Check your Groq API key and network.' });
  }
  console.error('Diagrams AI error:', e?.message || e);
  return res.status(500).json({ detail: e?.message || fallback });
}

// POST /api/diagrams/from-content – generate interactive diagram from lecture/text
diagramsRouter.post('/from-content', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const text = (req.body?.text || '').trim();
    const diagramType = (req.body?.diagramType || 'mind_map').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!text) {
      return res.status(400).json({ detail: 'text is required' });
    }
    const result = await groq.generateInteractiveDiagram(text, diagramType, lang);
    res.json(result);
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate diagram');
  }
});

// POST /api/diagrams/custom – generate custom diagram from topic/title (e.g. roadmap)
diagramsRouter.post('/custom', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const title = (req.body?.title || req.body?.topic || '').trim();
    const diagramType = (req.body?.diagramType || 'roadmap').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!title) {
      return res.status(400).json({ detail: 'title or topic is required' });
    }
    const result = await groq.generateCustomDiagram(title, diagramType, lang);
    res.json(result);
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate custom diagram');
  }
});

// POST /api/diagrams/infographic – generate infographic data from text/topic
diagramsRouter.post('/infographic', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const text = (req.body?.text || req.body?.title || '').trim();
    const infographicType = (req.body?.infographicType || 'timeline').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!text) {
      return res.status(400).json({ detail: 'text or title is required' });
    }
    const result = await groq.generateInfographicData(text, infographicType, lang);
    res.json(result);
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate infographic');
  }
});

// POST /api/diagrams/research-full – generate full research document with infographic sections
diagramsRouter.post('/research-full', authMiddleware, async (req, res) => {
  try {
    if (!groq.isConfigured()) {
      return res.status(503).json({ detail: 'AI is not configured. Set GROQ_API_KEY in .env' });
    }
    const topic = (req.body?.topic || req.body?.title || '').trim();
    const lang = req.body?.lang === 'en' ? 'en' : 'ar';
    if (!topic) {
      return res.status(400).json({ detail: 'topic or title is required' });
    }
    const result = await groq.generateFullResearch(topic, lang);
    res.json(result);
  } catch (e) {
    return handleGroqError(e, res, 'Failed to generate full research');
  }
});
