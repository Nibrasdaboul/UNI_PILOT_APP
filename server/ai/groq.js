/**
 * Groq AI service – chat, summarize, flashcards, quiz, translate.
 * Key from: 1) process.env.GROQ_API_KEY  2) server/groq-key.txt (one line, key only).
 */
import Groq from 'groq-sdk';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const MODEL = 'llama-3.3-70b-versatile';
const __dirname = dirname(fileURLToPath(import.meta.url));
const GROQ_KEY_FILE = join(__dirname, '..', 'groq-key.txt');
const PLACEHOLDER = 'PASTE_YOUR_GROQ_KEY_HERE';

function getGroqKey() {
  let key = process.env.GROQ_API_KEY?.trim();
  if (key) return key;
  try {
    if (existsSync(GROQ_KEY_FILE)) {
      key = readFileSync(GROQ_KEY_FILE, 'utf8').trim();
      if (key && key !== PLACEHOLDER) return key;
    }
  } catch (_) {}
  return '';
}

function getClient() {
  const key = getGroqKey();
  if (!key) return null;
  return new Groq({ apiKey: key });
}

export async function chat(messages, systemContext = '') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const all = [];
  if (systemContext) all.push({ role: 'system', content: systemContext });
  all.push(...messages.map((m) => ({ role: m.role, content: m.content })));
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: all,
    temperature: 0.7,
    max_tokens: 2048,
  });
  const text = completion.choices?.[0]?.message?.content?.trim();
  return text || '';
}

export async function summarize(text, lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const langNote = lang === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a study assistant. Summarize the following text clearly and concisely for a student. ${langNote} Output only the summary, no preamble.`,
      },
      { role: 'user', content: text.slice(0, 12000) },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

export async function generateFlashcards(text, count = 5, lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const langNote = lang === 'ar' ? 'Use Arabic for front and back.' : 'Use English for front and back.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a study assistant. Generate exactly ${count} flashcards from the text. Each card has "front" (question or term) and "back" (answer or definition). Reply with a valid JSON array only, no markdown: [{"front":"...","back":"..."}, ...]. ${langNote}`,
      },
      { role: 'user', content: text.slice(0, 8000) },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '[]';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '');
  try {
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr) ? arr.slice(0, count).map((c) => ({ front: c.front || '', back: c.back || '' })) : [];
  } catch {
    return [];
  }
}

export async function generateQuiz(text, count = 3, lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const langNote = lang === 'ar' ? 'Question and options in Arabic.' : 'Question and options in English.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a study assistant. Generate exactly ${count} multiple-choice questions from the text. Each has "question", "options" (array of 4 strings), "correct_index" (0-3). Reply with a valid JSON array only: [{"question":"...","options":["A","B","C","D"],"correct_index":0}, ...]. ${langNote}`,
      },
      { role: 'user', content: text.slice(0, 8000) },
    ],
    temperature: 0.5,
    max_tokens: 2048,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '[]';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '');
  try {
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr)
      ? arr.slice(0, count).map((q) => ({
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correct_index: Math.min(3, Math.max(0, parseInt(q.correct_index, 10) || 0)),
        }))
      : [];
  } catch {
    return [];
  }
}

export async function translate(text, targetLang, sourceLang = 'auto') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const target = targetLang === 'ar' ? 'Arabic' : targetLang === 'en' ? 'English' : targetLang;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a translator. Translate the following text to ${target}. Preserve meaning and tone. Output only the translation, no explanations.`,
      },
      { role: 'user', content: text.slice(0, 15000) },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

/** Generate mind map: root with main topics and nested children. Links ideas. */
export async function generateMindMap(text, lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const langNote = lang === 'ar' ? 'All labels in Arabic.' : 'All labels in English.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a study assistant. Create a mind map from the text. Structure: main title (root), then main headings as direct children, then subheadings and key points as nested children. Link related ideas. Output valid JSON only: {"label":"root title","children":[{"label":"...","children":[...]},...]}. Max 3 levels deep. ${langNote} No markdown.`,
      },
      { role: 'user', content: text.slice(0, 10000) },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '');
  try {
    const obj = JSON.parse(cleaned);
    return { label: obj.label || 'Topic', children: Array.isArray(obj.children) ? obj.children : [] };
  } catch {
    return { label: 'Topic', children: [] };
  }
}

/** Generate quiz with difficulty, type, source. question_type: multiple_choice | true_false | fill_blank | short_answer. difficulty: very_hard | hard | medium | easy. source_scope: within | beyond */
export async function generateQuizAdvanced(text, count, difficulty, questionType, sourceScope, lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const langNote = lang === 'ar' ? 'Questions and options in Arabic.' : 'Questions and options in English.';
  const diffNote = difficulty === 'very_hard' ? 'very hard' : difficulty === 'hard' ? 'hard' : difficulty === 'easy' ? 'easy' : 'medium';
  const typeNote = questionType === 'true_false' ? 'true/false only (options: ["صح","خطأ"] or ["True","False"])' : questionType === 'fill_blank' ? 'fill in the blank' : questionType === 'short_answer' ? 'short written answer (give model answer in correct_answer)' : 'multiple choice with 4 options';
  const scopeNote = sourceScope === 'beyond' ? 'Questions can extend beyond the text but must be answerable using concepts from the text.' : 'Strictly from the given text only.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a study assistant. Generate exactly ${count} questions. Difficulty: ${diffNote}. Type: ${typeNote}. Source: ${scopeNote}. Each question: "question", "options" (array, for true_false use 2 options), "correct_index" (0-based), "explanation" (why the answer is correct). Reply valid JSON array only: [{"question":"...","options":[],"correct_index":0,"explanation":"..."}]. ${langNote} No markdown.`,
      },
      { role: 'user', content: text.slice(0, 12000) },
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '[]';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '');
  try {
    const arr = JSON.parse(cleaned);
    return Array.isArray(arr)
      ? arr.slice(0, count).map((q) => ({
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correct_index: Math.max(0, parseInt(q.correct_index, 10) || 0),
          explanation: q.explanation || '',
        }))
      : [];
  } catch {
    return [];
  }
}

/** Remove Markdown formatting for plain-text display (###, **, *, etc.). */
function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

/**
 * Generate exam performance insight from quiz attempt: strengths, weaknesses, topics to focus.
 * Returns full analysis text for notes + suggested review topic for scheduling.
 * @param {string} quizTitle
 * @param {Array<{question: string, explanation?: string}>} questions
 * @param {Array<{question: string, correct: boolean, explanation?: string}>} results
 * @param {string} lang 'ar' | 'en'
 * @returns {{ content: string, suggestedTopic: string }}
 */
export async function generateExamInsight(quizTitle, questions, results, lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const wrong = results.filter((r) => !r.correct);
  const right = results.filter((r) => r.correct);
  const score = right.length;
  const max = results.length;
  const payload = JSON.stringify({
    quizTitle,
    score: `${score}/${max}`,
    correctQuestions: right.map((r) => r.question),
    wrongQuestions: wrong.map((r) => ({ question: r.question, explanation: r.explanation })),
  }, null, 2);
  const sys = isAr
    ? `أنت مستشار دراسي. حلّل أداء الطالب في الاختبار واكتب تحليلاً واضحاً للملاحظات يتضمن:
1) نقاط القوة: ما الذي أتقنه الطالب (من الأسئلة الصحيحة)؟
2) نقاط الضعف: ما الذي أخطأ فيه ولماذا (استخدم الشروحات)؟
3) مواضيع للتركيز: استخرج من الأسئلة الخاطئة المواضيع أو المفاهيم التي يجب عليه مراجعتها (مثلاً: الأشجار، الخوارزميات).
4) توصية واحدة قصيرة للجدولة: ماذا يراجع أولاً؟

مهم جداً: اكتب النص العادي فقط. لا تستخدم أي تنسيق Markdown: لا ### ولا ** ولا * ولا #. العناوين كنص عادي مثل "نقاط القوة:" و "نقاط الضعف:" بدون رموز. استخدم أسطر فارغة للفصل بين الأقسام و "- " للقوائم. في نهاية الرد أضف سطراً يبدأ بـ "موضوع مقترح للمراجعة:" ثم كلمة أو عبارة واحدة فقط.`
    : `You are a study coach. Analyze the student's quiz performance and write a clear note that includes:
1) Strengths: What did they get right?
2) Weaknesses: What did they get wrong and why (use explanations)?
3) Topics to focus on: From wrong answers, list concepts/topics to review.
4) One short scheduling suggestion: What to review first?

Important: Plain text only. Do not use any Markdown: no ###, no **, no *, no #. Use plain headings like "Strengths:" and "Weaknesses:". Use blank lines and "- " for lists. At the end add a line "Suggested review topic:" followed by one word or short phrase.`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: payload.slice(0, 8000) },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });
  let content = completion.choices?.[0]?.message?.content?.trim() || '';
  content = stripMarkdown(content);
  let suggestedTopic = '';
  const topicMatch = isAr
    ? content.match(/موضوع مقترح للمراجعة[:\s]+(.+?)(?:\n|$)/i) || content.match(/التركيز[:\s]+(.+?)(?:\n|$)/i)
    : content.match(/Suggested review topic[:\s]+(.+?)(?:\n|$)/i);
  if (topicMatch) suggestedTopic = topicMatch[1].trim().slice(0, 100);
  return { content, suggestedTopic };
}

/**
 * Clean transcript with AI: remove repetition, fix noise, understand dialect,
 * handle variable speed (slow/fast), preserve loud/quiet content.
 * @param {string} text - Raw transcript
 * @param {string} lang - 'ar' | 'en'
 * @returns {Promise<string>} Cleaned text
 */
export async function cleanTranscript(text, lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const sys = isAr
    ? `أنت خبير تحسين نصوص الصوت. المُدخل قد يكون من تسجيل فيه:
- تكرار كلمات أو مقاطع (مرحبامرحبا، أو كلام مكرر بسبب السرعة)
- تشويش وضوضاء في الخلفية
- لهجة عامية (مصرية، شامية، خليجية، مغاربية، إلخ) — احتفظ بالعامية ولا تحوّلها إلى فصحى إلا إذا كانت الكلمة خطأ واضحاً
- كلام سريع أو بطيء جداً (كلمات ناقصة أو مكررة بسبب السرعة)
- أجزاء عالية الصوت وأخرى منخفضة (قد يكون بعض النص غير واضح)

المطلوب: أعد النص واضحاً فقط. احذف التكرار والتشويش والكلمات الزائدة من الضوضاء. صحّح ما يمكن استنتاجه من السياق (الأصوات المنخفضة أو العالية). احتفظ باللهجة العامية. لا تضف تعليقاً ولا مقدمة — النص المحسّن فقط.`
    : `You are a transcript cleanup expert. The input may be from recording with:
- Repeated words or segments (from speaking fast/slow)
- Background noise and clutter
- Colloquial speech, slang, accents — preserve them; only fix clear errors
- Variable speech speed (very fast or slow) causing skipped or duplicated words
- Mixed volume (loud and quiet parts; some text unclear)

Task: Return only the cleaned text. Remove repetition and noise-induced filler. Fix what can be inferred from context (quiet/loud parts). Keep colloquial language. No preamble or comment.`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: (text || '').slice(0, 15000) },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });
  return completion.choices?.[0]?.message?.content?.trim() || text || '';
}

/** Improve or structure a student note with AI (summarize, bullet points, or clarify). */
export async function improveNote(content, lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const sys = isAr
    ? 'أنت مساعد دراسي. المُدخل ملاحظة طالب. حسّنها: نظّم الأفكار، أضف عناوين فرعية إن لزم، واترك المحتوى مفيداً للمراجعة. أعد النص المحسّن فقط بدون مقدمة.'
    : 'You are a study assistant. The input is a student note. Improve it: organize ideas, add subheadings if needed, keep it useful for revision. Return only the improved text, no preamble.';
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: (content || '').slice(0, 4000) },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });
  return completion.choices?.[0]?.message?.content?.trim() || content || '';
}

/**
 * Whisper prompt for Arabic: force exact colloquial transcription, no conversion to Fusha.
 * Kept under ~224 tokens. Improves quality for uploaded files in عامية.
 */
const WHISPER_PROMPT_AR =
  'المطلوب: كتابة النص بالضبط كما يُسمع من المتحدث. اللهجة عامية (مصرية أو شامية أو خليجية أو مغربية أو أي عامية). لا تحوّل أي كلمة إلى الفصحى. اكتب كل كلمة كما نُطقت: إيه، إزيك، يعني، خلاص، يلا، ماشي، شو، كيفك، وين، ليش، الخ. إذا سمعت عامية اكتب عامية. الهدف مطابقة الصوت حرفياً دون تصحيح للفصحى.';
const WHISPER_PROMPT_EN =
  'Transcribe exactly what the speaker says. Preserve colloquial speech, slang, and accent word for word. Do not correct or formalize. Match the audio literally.';

/**
 * Transcribe audio file using Groq Whisper.
 * Uses whisper-large-v3 for best quality (especially colloquial Arabic); optional turbo for speed.
 * Strong prompt keeps dialect (عامية) and avoids conversion to Modern Standard Arabic.
 * @param {import('fs').ReadStream} fileStream - Read stream of the audio file
 * @param {{ language?: string, useTurbo?: boolean }} [opts] - language 'ar'|'en'; useTurbo for faster, slightly lower quality
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(fileStream, opts = {}) {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const lang = opts.language || undefined;
  const useTurbo = opts.useTurbo === true;
  const model = useTurbo ? 'whisper-large-v3-turbo' : 'whisper-large-v3';
  const prompt = lang === 'en' ? WHISPER_PROMPT_EN : WHISPER_PROMPT_AR;
  const transcription = await client.audio.transcriptions.create({
    file: fileStream,
    model,
    language: lang === 'en' ? 'en' : 'ar',
    prompt: prompt.slice(0, 700),
    temperature: 0.0,
  });
  return (transcription?.text || '').trim();
}

export function isConfigured() {
  return !!getGroqKey();
}

/**
 * Generate one smart multiple-choice question strictly about the given course (its subject/topics).
 * Optionally use student's study content to enrich; optionally avoid repeating recent questions.
 * @param {string} courseName - e.g. "البرمجة غرضية التوجه" / "Object-Oriented Programming"
 * @param {string} [contextText] - Optional: snippets from summaries/flashcards/mindmaps for this course
 * @param {string} [lang] - 'ar' | 'en'
 * @param {string[]} [avoidQuestionTexts] - Recent question texts to avoid repeating (same or very similar)
 * @returns {{ question: string, options: string[], correct_index: number }}
 */
export async function generateSmartQuestion(courseName, contextText = '', lang = 'en', avoidQuestionTexts = []) {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const avoidList = Array.isArray(avoidQuestionTexts) ? avoidQuestionTexts.filter((t) => t && String(t).trim()).slice(0, 15) : [];
  const avoidBlock = avoidList.length
    ? (isAr
        ? `\nمهم: لا تكرر أسئلة شبيهة أو مطابقة لهذه الأسئلة السابقة (أنشئ سؤالاً جديداً مختلفاً تماماً):\n${avoidList.map((q) => '- ' + String(q).slice(0, 150)).join('\n')}`
        : `\nImportant: Do NOT repeat or generate questions similar to these previous ones (create a completely new, different question):\n${avoidList.map((q) => '- ' + String(q).slice(0, 150)).join('\n')}`)
    : '';

  const sys = isAr
    ? `أنت معلم خبير. المطلوب: إنشاء سؤال واحد فقط من نوع اختيار من متعدد (4 خيارات).

القاعدة الأساسية: السؤال يجب أن يكون متعلقاً حصرياً وبشكل مباشر بمادة الطالب المحددة أدناه (اسم المادة/المقرر). مثلاً:
- إذا كانت المادة "البرمجة غرضية التوجه" أو "Object-Oriented Programming": اسأل فقط عن مفاهيم هذه المادة مثل (الكلاسات، الكائنات، التوريث، التغليف، تعدد الأشكال، التجريد، الواجهات، إلخ). لا تسأل عن الخوارزميات أو هياكل البيانات أو غيرها إلا إذا كانت المادة نفسها عن ذلك.
- إذا كانت المادة "هياكل البيانات": اسأل فقط عن القوائم، الأشجار، المكدس، الطابور، إلخ.
- إذا كانت المادة "قواعد البيانات": اسأل فقط عن SQL، الجداول، العلاقات، التطبيع، إلخ.

ممنوع: طرح سؤال عن موضوع لا يخص المادة المحددة. استخدم اسم المادة ووصفها (إن وُجد) واختر موضوعاً من صلب هذه المادة فقط. إذا وُفر سياق من ملخصات أو بطاقات الطالب فاستخدمه لصياغة سؤال أدق ضمن نفس المادة فقط.
${avoidBlock}

أرجع إجابة بصيغة JSON فقط بدون markdown ولا شرح:
{"question":"نص السؤال","options":["الخيار أ","الخيار ب","الخيار ج","الخيار د"],"correct_index":0}
correct_index بين 0 و 3.`
    : `You are an expert teacher. Generate exactly one multiple-choice question (4 options).

Core rule: The question MUST be exclusively and directly about the student's course/subject specified below (the course name). Examples:
- If the course is "Object-Oriented Programming" or "البرمجة غرضية التوجه": ask ONLY about OOP concepts (classes, objects, inheritance, encapsulation, polymorphism, abstraction, interfaces, etc.). Do NOT ask about algorithms, data structures, or other subjects unless the course name is exactly that.
- If the course is "Data Structures": ask ONLY about lists, trees, stack, queue, etc.
- If the course is "Databases": ask ONLY about SQL, tables, relations, normalization, etc.

Forbidden: Asking about a topic that does not belong to the specified course. Use the course name and its description (if any) and choose a topic that is core to this course only. If context from the student's summaries or flashcards is provided, use it to craft a more precise question still within this course only.
${avoidBlock}

Reply with valid JSON only, no markdown or explanation:
{"question":"Question text","options":["Option A","Option B","Option C","Option D"],"correct_index":0}
correct_index is 0-3.`;

  const userContent = `Course name (generate question ONLY about this subject): ${(courseName || '').slice(0, 300)}
${(courseName || '').trim() ? '' : '(use a generic university subject)'}
${contextText.trim() ? `\nOptional context from student's material (use only to make the question more specific to what they studied; question must still be about the course above):\n${contextText.slice(0, 5000)}` : ''}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userContent },
    ],
    temperature: 0.6,
    max_tokens: 1024,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const options = Array.isArray(obj.options) ? obj.options.slice(0, 4).map((o) => String(o).slice(0, 500)) : [];
    const correct_index = Math.min(3, Math.max(0, parseInt(obj.correct_index, 10) || 0));
    return {
      question: String(obj.question || '').slice(0, 1000),
      options: options.length >= 2 ? options : ['A', 'B', 'C', 'D'],
      correct_index,
    };
  } catch {
    return {
      question: isAr ? `ما المفهوم الأساسي في ${courseName}؟` : `What is a key concept in ${courseName}?`,
      options: ['A', 'B', 'C', 'D'],
      correct_index: 0,
    };
  }
}

/**
 * Generate a HARD daily challenge question: application, equation, or multi-step exercise
 * for the given course. Harder than generateSmartQuestion; used for "تحدي اليوم".
 * @param {string} courseName
 * @param {string} [contextText]
 * @param {string} [lang] 'ar' | 'en'
 * @returns {{ question: string, options: string[], correct_index: number }}
 */
export async function generateDailyChallengeQuestion(courseName, contextText = '', lang = 'en') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';

  const sys = isAr
    ? `أنت معلم خبير. المطلوب: إنشاء سؤال واحد صعب من نوع اختيار من متعدد (4 خيارات) يخص المادة المحددة أدناه.

الشروط الإلزامية:
- السؤال يجب أن يكون أصعب من سؤال تذكّر بسيط: إما تطبيق مفهوم، أو معادلة/مسألة حسابية تحتاج خطوتين أو أكثر، أو تحليل حالة، أو مقارنة بين خيارين تقنياً.
- أمثلة لأنواع الأسئلة المطلوبة: "إذا كان كذا فما الناتج؟"، "ما قيمة X في المعادلة ...؟"، "أي من التالي ينتج عن تطبيق المفهوم X؟"، "ما الخطأ في الكود/الخطوات التالية؟"، "ما الترتيب الصحيح لـ ...؟"
- السؤال متعلق حصرياً بالمادة المحددة (مثلاً برمجة غرضية، هياكل بيانات، قواعد بيانات، رياضيات، إلخ).
- الخيارات واضحة؛ correct_index يشير إلى الإجابة الصحيحة الوحيدة (0–3).

أرجع JSON فقط بدون markdown:
{"question":"نص السؤال","options":["أ","ب","ج","د"],"correct_index":0}`
    : `You are an expert teacher. Generate exactly one HARD multiple-choice question (4 options) for the course specified below.

Mandatory:
- The question must be harder than simple recall: either application of a concept, an equation/calculation requiring two or more steps, case analysis, or technical comparison.
- Examples: "If ... then what is the result?", "What is the value of X in the equation ...?", "Which of the following results from applying concept X?", "What is wrong with the following code/steps?", "What is the correct order of ...?"
- The question is exclusively about the specified course (e.g. OOP, data structures, databases, math).
- Options are clear; correct_index is the single correct answer (0–3).

Reply with JSON only, no markdown:
{"question":"Question text","options":["A","B","C","D"],"correct_index":0}`;

  const userContent = `Course name (generate ONE hard question only about this subject): ${(courseName || '').slice(0, 300)}
${contextText.trim() ? `\nOptional context (use to make the question more specific, still about the course):\n${contextText.slice(0, 4000)}` : ''}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userContent },
    ],
    temperature: 0.5,
    max_tokens: 1024,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const options = Array.isArray(obj.options) ? obj.options.slice(0, 4).map((o) => String(o).slice(0, 500)) : [];
    const correct_index = Math.min(3, Math.max(0, parseInt(obj.correct_index, 10) || 0));
    return {
      question: String(obj.question || '').slice(0, 1200),
      options: options.length >= 2 ? options : ['A', 'B', 'C', 'D'],
      correct_index,
    };
  } catch {
    return {
      question: isAr ? `ما الناتج الصحيح عند تطبيق المفهوم الأساسي في ${courseName}؟` : `What is the correct result when applying the key concept in ${courseName}?`,
      options: ['A', 'B', 'C', 'D'],
      correct_index: 0,
    };
  }
}

// —— Theses / Research: sources and writing help ——

/**
 * Generate suggested sources for a research topic: websites, YouTube, academic DBs.
 * Returns JSON: { sources: [ { type, title, url, description? } ] }
 * Types: website | youtube | academic
 */
export async function thesesSources(topic, lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const sys = isAr
    ? `أنت مساعد أبحاث للطلاب. المطلوب: اقترح مصادر مفيدة لموضوع البحث الذي يحدده الطالب.
المصادر يجب أن تشمل:
1) مواقع ويب عامة أو متخصصة (أدخل عنوان URL حقيقي معروف إن أمكن، أو رابط بحث مثل Google)
2) فيديوهات يوتيوب: أعطِ رابط بحث يوتيوب بصيغة: https://www.youtube.com/results?search_query=كلمة_البحث (استبدل المسافات بشرطة سفلية أو +)
3) قواعد أكاديمية مثل: Google Scholar، IEEE Xplore، PubMed، ScienceDirect، JSTOR، ResearchGate، إلخ (أدخل الرابط الرسمي للموقع)

أرجع إجابة بصيغة JSON فقط بدون أي نص إضافي ولا markdown:
{"sources":[{"type":"website|youtube|academic","title":"عنوان المصدر","url":"https://...","description":"وصف قصير بالعربية"}]}
يجب أن يكون هناك بين 5 و 15 مصدراً، مع تنوع بين المواقع والفيديو والأكاديمية.`
    : `You are a research assistant for students. Suggest useful sources for the student's topic.
Include: 1) General or topic-specific websites (real known URLs or search links). 2) YouTube: use search URL https://www.youtube.com/results?search_query=search_terms (use + or _ for spaces). 3) Academic: Google Scholar, IEEE Xplore, PubMed, ScienceDirect, JSTOR, ResearchGate, etc. (official URLs).

Reply with valid JSON only, no markdown or extra text:
{"sources":[{"type":"website|youtube|academic","title":"Source title","url":"https://...","description":"Short description"}]}
Provide 5–15 sources, mixed types.`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Topic: ${(topic || '').slice(0, 500)}` },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{"sources":[]}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const list = Array.isArray(obj.sources) ? obj.sources : [];
    return {
      sources: list.slice(0, 20).map((s) => ({
        type: ['website', 'youtube', 'academic'].includes(s.type) ? s.type : 'website',
        title: String(s.title || '').slice(0, 300),
        url: String(s.url || '').slice(0, 500),
        description: s.description != null ? String(s.description).slice(0, 400) : undefined,
      })),
    };
  } catch {
    return { sources: [] };
  }
}

/** Thesis help types */
const THESIS_HELP_TYPES = {
  scientific_research: { ar: 'بحث علمي', en: 'Scientific research' },
  seminar: { ar: 'حلقة بحث / سيمينار', en: 'Research seminar' },
  report: { ar: 'تقرير متعلق بموضوع', en: 'Topic report' },
  thesis_masters: { ar: 'رسالة ماجستير', en: "Master's thesis" },
  thesis_phd: { ar: 'رسالة دكتوراه', en: 'PhD thesis' },
};

/**
 * Get AI guidance for theses: structure, outline, tips, or draft help.
 * @param {string} topic - Research topic
 * @param {string} type - scientific_research | seminar | report | thesis_masters | thesis_phd
 * @param {string} [extraPrompt] - Optional extra instructions
 * @param {string} [lang] - 'ar' | 'en'
 */
export async function thesesHelp(topic, type, extraPrompt = '', lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const typeLabel = THESIS_HELP_TYPES[type] ? THESIS_HELP_TYPES[type][isAr ? 'ar' : 'en'] : type;
  const sys = isAr
    ? `أنت مستشار أكاديمي متخصص في مساعدة الطلاب في كتابة الأبحاث العلمية وحلقات البحث والتقارير ورسائل الماجستير والدكتوراه.
المطلوب: بناءً على نوع العمل (${typeLabel}) والموضوع الذي يحدده الطالب، قدّم:
1) إطاراً أو هيكلاً مقترحاً (عناوين رئيسية وفرعية).
2) نصائح منهجية لكتابة هذا النوع من العمل.
3) نقاط مهمة يجب على الطالب مراعاتها (منهجية، مراجع، لغة).
4) إن طلب الطالب مساعدة في صياغة فقرة أو قسم، قدّم نموذجاً أو مثالاً واضحاً.
أجب بلغة الطالب (عربي أو إنجليزي). كن واضحاً ومنظماً. لا تستخدم markdown إن أمكن؛ استخدم أسطر وعناوين نصية.`
    : `You are an academic advisor helping students with scientific research, seminars, reports, Master's and PhD theses.
For the chosen type (${typeLabel}) and the student's topic, provide:
1) A suggested structure or outline (main and sub-headings).
2) Methodological tips for writing this type of work.
3) Key points the student should consider (methodology, references, language).
4) If they ask for help drafting a section, give a clear example or template.
Use the student's language. Be clear and structured. Prefer plain text with line breaks over markdown.`;
  let userContent = `Topic: ${(topic || '').slice(0, 800)}`;
  if (extraPrompt && extraPrompt.trim()) userContent += `\n\nAdditional instructions: ${extraPrompt.trim().slice(0, 1000)}`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userContent },
    ],
    temperature: 0.5,
    max_tokens: 4096,
  });
  return completion.choices?.[0]?.message?.content?.trim() || '';
}

// —— Interactive Diagrams & Infographics (Groq) ——

const DIAGRAM_TYPES = ['mind_map', 'roadmap', 'flowchart', 'timeline', 'tree', 'venn', 'pyramid', 'funnel', 'fishbone'];
const INFOGRAPHIC_TYPES = ['timeline', 'bar', 'pie', 'line', 'comparison', 'process'];

/**
 * Generate interactive diagram from lecture text or content.
 * Returns: { diagramType, title, nodes: [ { id, label, children: [{ id, label }], connectionIds: [] } ] }
 */
function getDiagramSystemPrompt(diagramType, isAr, fromContent) {
  const typeDesc = {
    mind_map: isAr ? 'خريطة ذهنية: فكرة رئيسية وأفكار فرعية مترابطة بدون ترتيب محدد' : 'Mind map: main idea and related ideas, no rank or order',
    roadmap: isAr ? 'خارطة طريق: مراحل ومواعيد ومحطات' : 'Roadmap: milestones and dates, stages',
    flowchart: isAr ? 'مخطط انسيابي: عمليات وتدفق قرارات' : 'Flowchart: processes and decision flow',
    timeline: isAr ? 'خط زمني: أحداث مرتبة زمنياً' : 'Timeline: events in time order',
    tree: isAr ? 'شجرة: علاقات أب-ابن (هيكل تنظيمي)' : 'Tree: parent-child relationships',
    venn: isAr ? ' Venn: تداخل وتشابه واختلاف' : 'Venn: overlaps and differences',
    pyramid: isAr ? 'هرم: أجزاء في هرم/أولوية' : 'Pyramid: hierarchy levels',
    funnel: isAr ? 'قمع: مراحل وخطوات تتابعية' : 'Funnel: stages and steps',
    fishbone: isAr ? 'عظم السمكة: أسباب وتأثيرات' : 'Fishbone: causes and effects',
  };
  const t = typeDesc[diagramType] || typeDesc.mind_map;
  const jsonSchema = `{"diagramType":"${diagramType}","title":"string","nodes":[{"id":"n1","label":"Section title","children":[{"id":"n1a","label":"Sub-item"}],"connectionIds":["n2"]}]}. Each node MUST have unique id (n1, n2, n3...). connectionIds = ids of other nodes this one connects to. 4-12 nodes. Each node can have 0-6 children for dropdown.`;
  if (fromContent) {
    return isAr
      ? `أنت مساعد تعليمي. أنشئ مخططاً تفاعلياً من النص المقدم. النوع: ${t}. المخرجات JSON فقط بدون markdown: ${jsonSchema}`
      : `You are a study assistant. Create an interactive diagram from the given text. Type: ${t}. Output valid JSON only, no markdown: ${jsonSchema}`;
  }
  return isAr
    ? `أنت مساعد تعليمي. أنشئ مخططاً تفاعلياً مخصصاً للموضوع/العنوان المقدم. النوع: ${t}. المخرجات JSON فقط: ${jsonSchema}`
    : `You are a study assistant. Create a custom interactive diagram for the given topic/title. Type: ${t}. Output valid JSON only: ${jsonSchema}`;
}

export async function generateInteractiveDiagram(text, diagramType = 'mind_map', lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const type = DIAGRAM_TYPES.includes(diagramType) ? diagramType : 'mind_map';
  const isAr = lang === 'ar';
  const sys = getDiagramSystemPrompt(type, isAr, true);
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: (text || '').slice(0, 12000) },
    ],
    temperature: 0.4,
    max_tokens: 4096,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  return parseDiagramJson(raw);
}

export async function generateCustomDiagram(topicTitle, diagramType = 'roadmap', lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const type = DIAGRAM_TYPES.includes(diagramType) ? diagramType : 'roadmap';
  const isAr = lang === 'ar';
  const sys = getDiagramSystemPrompt(type, isAr, false);
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Topic/Title: ${(topicTitle || '').slice(0, 500)}` },
    ],
    temperature: 0.4,
    max_tokens: 4096,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  return parseDiagramJson(raw);
}

function parseDiagramJson(raw) {
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const nodes = Array.isArray(obj.nodes) ? obj.nodes : [];
    const seen = new Set();
    const normalized = nodes.slice(0, 20).map((n, i) => {
      const id = (n.id && String(n.id).trim()) || `n${i + 1}`;
      const uniqueId = seen.has(id) ? `${id}_${i}` : id;
      if (!seen.has(uniqueId)) seen.add(uniqueId);
      const children = Array.isArray(n.children)
        ? n.children.slice(0, 8).map((c, j) => ({
            id: c.id && String(c.id).trim() ? String(c.id) : `${uniqueId}_${j}`,
            label: String(c.label || '').slice(0, 200),
          }))
        : [];
      return {
        id: uniqueId,
        label: String(n.label || '').slice(0, 300),
        children,
        connectionIds: Array.isArray(n.connectionIds) ? n.connectionIds.filter((x) => x && String(x).trim()).slice(0, 10) : [],
      };
    });
    return {
      diagramType: obj.diagramType || 'mind_map',
      title: String(obj.title || 'Diagram').slice(0, 200),
      nodes: normalized,
    };
  } catch {
    return { diagramType: 'mind_map', title: 'Diagram', nodes: [] };
  }
}

/**
 * Generate infographic data from text or topic. Returns structure for timeline, bar, pie, line, comparison.
 * { infographicType, title, data: [ { label, value?, date?, items? } ] }
 */
export async function generateInfographicData(textOrTitle, infographicType = 'timeline', lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const type = INFOGRAPHIC_TYPES.includes(infographicType) ? infographicType : 'timeline';
  const isAr = lang === 'ar';
  const typeHint = {
    timeline: isAr ? 'أحداث أو مراحل مع تواريخ/ترتيب. data: [{label, date أو order}]' : 'Events or stages with dates/order. data: [{label, date or order}]',
    bar: isAr ? 'مقارنة فئات بأعمدة. data: [{label, value}]' : 'Compare categories. data: [{label, value}]',
    pie: isAr ? 'أجزاء من كل. data: [{label, value}]' : 'Parts of a whole. data: [{label, value}]',
    line: isAr ? 'اتجاهات عبر الزمن. data: [{label, value, period أو date}]' : 'Trends over time. data: [{label, value, period}]',
    comparison: isAr ? 'عناصر للمقارنة. data: [{label, items: [string]}]' : 'Items to compare. data: [{label, items: [string]}]',
    process: isAr ? 'خطوات عملية. data: [{label, order, description?}]' : 'Process steps. data: [{label, order, description?}]',
  };
  const sys = isAr
    ? `أنت مساعد انفوغرافيك. من النص أو العنوان أنشئ بيانات انفوغرافيك منظمة. النوع: ${type}. المخرجات JSON فقط بدون markdown: {"infographicType":"${type}","title":"عنوان","data":[{"label":"...","value":عدد اختياري,"date":"اختياري","items":[]}]}. 4-15 عنصر في data. ${typeHint[type]}`
    : `You are an infographic assistant. From the text or title create structured infographic data. Type: ${type}. Output valid JSON only, no markdown: {"infographicType":"${type}","title":"string","data":[{"label":"...","value":number optional,"date":"optional","items":[]}]}. 4-15 items in data. ${typeHint[type]}`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: (textOrTitle || '').slice(0, 8000) },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const data = Array.isArray(obj.data) ? obj.data.slice(0, 25) : [];
    return {
      infographicType: obj.infographicType || type,
      title: String(obj.title || 'Infographic').slice(0, 200),
      data: data.map((d) => ({
        label: String(d.label || '').slice(0, 150),
        value: typeof d.value === 'number' ? d.value : undefined,
        date: d.date != null ? String(d.date).slice(0, 80) : undefined,
        order: typeof d.order === 'number' ? d.order : undefined,
        description: d.description != null ? String(d.description).slice(0, 300) : undefined,
        items: Array.isArray(d.items) ? d.items.map((x) => String(x).slice(0, 150)) : undefined,
      })),
    };
  } catch {
    return { infographicType: type, title: 'Infographic', data: [] };
  }
}

/** Section types for full research infographic */
const RESEARCH_SECTION_TYPES = ['timeline', 'bar', 'line', 'pie', 'progress_rings', 'key_facts', 'comparison', 'stats_cards', 'process'];

/**
 * Generate a full research document on a topic with multiple infographic sections.
 * Returns: { title, summary, sections: [ { type, title, data: [...] | items: [...] } ] }
 */
export async function generateFullResearch(topic, lang = 'ar') {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not set');
  const isAr = lang === 'ar';
  const sys = isAr
    ? `أنت خبير أبحاث وانفوغرافيك. المطلوب: إنشاء بحث كامل حول الموضوع الذي يحدده الطالب، يتضمن كل المعلومات اللازمة ومنسق كوثيقة انفوغرافيك احترافية.
أنشئ بنية JSON فقط بدون markdown:
{
  "title": "عنوان البحث",
  "summary": "فقرة ملخص تمهيدية (2-4 جمل)",
  "sections": [
    { "type": "timeline", "title": "عنوان القسم", "data": [{"label":"...","date":"...","description":"..."}] },
    { "type": "bar", "title": "عنوان", "data": [{"label":"...","value":عدد}] },
    { "type": "line", "title": "عنوان", "data": [{"label":"...","value":عدد,"period":"..."}] },
    { "type": "pie", "title": "عنوان", "data": [{"label":"...","value":عدد}] },
    { "type": "progress_rings", "title": "عنوان (مثلاً نسب أو مؤشرات)", "data": [{"label":"...","value":عدد 0-100}] },
    { "type": "key_facts", "title": "حقائق رئيسية", "items": ["حقيقة 1", "حقيقة 2", ...] },
    { "type": "comparison", "title": "مقارنة", "data": [{"label":"عنوان","items":["نقطة 1","نقطة 2"]}] },
    { "type": "stats_cards", "title": "إحصائيات", "data": [{"label":"مثل 40% مؤيدون","value":40,"subtitle":"وصف قصير"}] },
    { "type": "process", "title": "مراحل أو خطوات", "data": [{"label":"...","order":1,"description":"..."}] }
  ]
}
استخدم 5 إلى 10 أقسام متنوعة (timeline, bar, line, pie, progress_rings, key_facts, comparison, stats_cards, process). كل قسم له عنوان وبيانات مناسبة. data أو items حسب النوع.`
    : `You are a research and infographic expert. Create a full research document on the student's topic with all necessary information, formatted as a professional infographic document.
Output valid JSON only, no markdown:
{
  "title": "Research title",
  "summary": "Intro summary paragraph (2-4 sentences)",
  "sections": [
    { "type": "timeline", "title": "Section title", "data": [{"label":"...","date":"...","description":"..."}] },
    { "type": "bar", "title": "Title", "data": [{"label":"...","value":number}] },
    { "type": "line", "title": "Title", "data": [{"label":"...","value":number,"period":"..."}] },
    { "type": "pie", "title": "Title", "data": [{"label":"...","value":number}] },
    { "type": "progress_rings", "title": "Title (e.g. percentages)", "data": [{"label":"...","value":0-100}] },
    { "type": "key_facts", "title": "Key facts", "items": ["fact1", "fact2"] },
    { "type": "comparison", "title": "Comparison", "data": [{"label":"Title","items":["point1","point2"]}] },
    { "type": "stats_cards", "title": "Statistics", "data": [{"label":"e.g. 40% agree","value":40,"subtitle":"short desc"}] },
    { "type": "process", "title": "Steps", "data": [{"label":"...","order":1,"description":"..."}] }
  ]
}
Use 5-10 varied sections. Each section has title and appropriate data or items.`;
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Topic: ${(topic || '').slice(0, 500)}` },
    ],
    temperature: 0.4,
    max_tokens: 8192,
  });
  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  const cleaned = raw.replace(/^```json?\s*|\s*```$/g, '').trim();
  try {
    const obj = JSON.parse(cleaned);
    const sections = Array.isArray(obj.sections) ? obj.sections.slice(0, 15) : [];
    const normalized = sections.map((s) => {
      const type = RESEARCH_SECTION_TYPES.includes(s.type) ? s.type : 'key_facts';
      const title = String(s.title || '').slice(0, 200);
      if (type === 'key_facts' && Array.isArray(s.items)) {
        return { type, title, items: s.items.slice(0, 20).map((x) => String(x).slice(0, 300)) };
      }
      const data = Array.isArray(s.data) ? s.data.slice(0, 25) : [];
      return {
        type,
        title,
        data: data.map((d) => ({
          label: String(d.label || '').slice(0, 200),
          value: typeof d.value === 'number' ? d.value : undefined,
          date: d.date != null ? String(d.date).slice(0, 100) : undefined,
          period: d.period != null ? String(d.period).slice(0, 80) : undefined,
          order: typeof d.order === 'number' ? d.order : undefined,
          description: d.description != null ? String(d.description).slice(0, 400) : undefined,
          subtitle: d.subtitle != null ? String(d.subtitle).slice(0, 150) : undefined,
          items: Array.isArray(d.items) ? d.items.map((x) => String(x).slice(0, 200)) : undefined,
        })),
      };
    });
    return {
      title: String(obj.title || 'Research').slice(0, 200),
      summary: String(obj.summary || '').slice(0, 1500),
      sections: normalized,
    };
  } catch {
    return { title: 'Research', summary: '', sections: [] };
  }
}

// —— Text-to-Speech (Orpheus on Groq) ——
const TTS_MAX_CHARS = 200;
const GROQ_TTS_EN = 'canopylabs/orpheus-v1-english';
const GROQ_TTS_AR = 'canopylabs/orpheus-arabic-saudi';

export const GROQ_TTS_VOICES_EN = [
  { id: 'autumn', name: 'Autumn', gender: 'female' },
  { id: 'diana', name: 'Diana', gender: 'female' },
  { id: 'hannah', name: 'Hannah', gender: 'female' },
  { id: 'austin', name: 'Austin', gender: 'male' },
  { id: 'daniel', name: 'Daniel', gender: 'male' },
  { id: 'troy', name: 'Troy', gender: 'male' },
];

export const GROQ_TTS_VOICES_AR = [
  { id: 'fahad', name: 'Fahad', gender: 'male' },
  { id: 'sultan', name: 'Sultan', gender: 'male' },
  { id: 'lulwa', name: 'Lulwa', gender: 'female' },
  { id: 'noura', name: 'Noura', gender: 'female' },
];

function chunkTextForTts(text, maxLen = TTS_MAX_CHARS) {
  const t = (text || '').trim();
  if (!t) return [];
  if (t.length <= maxLen) return [t];
  const chunks = [];
  let rest = t;
  while (rest.length > 0) {
    if (rest.length <= maxLen) {
      chunks.push(rest);
      break;
    }
    const slice = rest.slice(0, maxLen);
    const last = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('؟ '),
      slice.lastIndexOf('? '),
      slice.lastIndexOf('\n'),
      slice.lastIndexOf(' ')
    );
    const splitAt = last > maxLen / 2 ? last + 1 : maxLen;
    chunks.push(rest.slice(0, splitAt).trim());
    rest = rest.slice(splitAt).trim();
  }
  return chunks.filter(Boolean);
}

/**
 * Groq TTS (Orpheus). Returns array of WAV buffers.
 * @param {string} text
 * @param {'ar'|'en'} lang
 * @param {string} voiceId - voice id for that language
 */
export async function getSpeechChunks(text, lang = 'en', voiceId = null) {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY not set');
  const isAr = lang === 'ar';
  const model = isAr ? GROQ_TTS_AR : GROQ_TTS_EN;
  const voices = isAr ? GROQ_TTS_VOICES_AR : GROQ_TTS_VOICES_EN;
  const voice = voiceId && voices.some((v) => v.id === voiceId) ? voiceId : voices[0].id;
  const chunks = chunkTextForTts(text);
  const buffers = [];
  for (const chunk of chunks) {
    const response = await client.audio.speech.create({
      model,
      voice,
      input: chunk,
      response_format: 'wav',
    });
    const ab = await response.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }
  return buffers;
}
