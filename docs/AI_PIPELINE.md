# UniPilot — AI System Design

## Overview

- **Provider:** Groq (primary). Configuration via `GROQ_API_KEY`.
- **Uses:** Chat (coach), summarize, flashcards, quiz, mind map, translate, transcript cleanup, note improve, theses/diagrams/infographics, TTS, smart/daily questions.

## Prompt Templates

- Prompts live in **server/ai/groq.js** (inline system/user messages). For scale, consider moving to:
  - A **prompts** module (e.g. `server/ai/prompts.js`) with named templates and variable substitution.
  - Or an external store (DB or CMS) for non-developers to edit.

## AI Caching

- **Current:** No response caching. Same input can hit the API repeatedly.
- **Recommendation:** For identical or hashed inputs (e.g. same text for “summarize”), cache by `(feature, inputHash)` in Redis with TTL (e.g. 24h). Implement in a wrapper around `groq.summarize`, `generateFlashcards`, etc., and skip Groq when cache hit.

## Usage Limits

- **Free tier:** `AI_FREE_MONTHLY_LIMIT` (default 50) requests per user per month. Enforced by **requireAiQuota** middleware; apply to study and AI routes that call Groq.
- **Pro / Student:** Unlimited (no quota check).
- **Metering:** Each AI call should:
  1. Call `subscriptionService.canUseAi(userId)` (or use `requireAiQuota` middleware).
  2. After success, call `subscriptionService.incrementAiUsage(userId, feature, tokensApprox)` and `subscriptionService.logAiRequest(userId, feature, model, tokensApprox)`.

## Fallback Models

- **Current:** Single model `llama-3.3-70b-versatile` in groq.js. No fallback.
- **Recommendation:** On Groq 503/5xx, retry once; then optionally call a fallback (e.g. another Groq model or a different provider) or return a user-friendly “AI temporarily unavailable” message.

## Cost Monitoring

- **ai_requests** table logs each request (user_id, feature, model, tokens_approx). Admin endpoint `GET /api/admin/ai-costs` exposes recent counts and 7-day summary by feature for cost visibility.
