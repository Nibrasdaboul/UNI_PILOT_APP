# Why UniPilot? — Making It Essential for Students

## The Problem (Friend's Feedback)

> "I don't feel this program is necessary — I could use ChatGPT or DeepSeek. What does UniPilot offer that would make me **have** to use it?"

Generic AI (ChatGPT, DeepSeek, etc.) does **not** know:
- Your real grades and GPA
- Your course list and which subject you're weak in
- Your planner, deadlines, or exam dates
- Your uploaded PDFs and notes

So when you ask "How do I raise my GPA?" or "What should I study first?", the AI gives **generic** advice. UniPilot gives **personalized** advice because it has **your data in one place**.

---

## Core Differentiator (One Sentence)

**UniPilot is the only place where your grades, schedule, and study materials are connected — so the AI and tools give advice that is actually about *you*, not a random student.**

---

## Features That Make UniPilot Indispensable

### 1. **AI That Knows YOUR Data**
- **Current:** AI Coach receives your courses (with grades), CGPA, credits, and upcoming tasks in the system prompt.
- **Make it visible:** On Dashboard and in AI Coach, show one line like: *"لتحسين معدلك ركز على [أضعف مادة] — درجتك الحالية X%"* so the user sees the AI is using their real data.
- **Upgrade:** When user asks "كيف أرفع معدلي؟", the model can say: "أنت حالياً في مادة X عند 65% ومادة Y عند 80% — ركز على X."

### 2. **"What Grade Do I Need on the Final?" (Grade Guard)**
- Only UniPilot can compute this: user has grade items (quiz 20%, midterm 30%, final 50%). We know current weighted grade from entered items; we can compute: *"To get 60% overall you need at least 72% on the final."*
- **Where:** Course detail page — small calculator: "I want [target]% overall → You need **X%** on the final exam."
- ChatGPT cannot do this without the user manually entering all grades and weights.

### 3. **Study Tools From YOUR Materials**
- Emphasize: *"ملخص وبطاقات واختبار من ملاحظاتك وملفاتك أنت — ليس من النت."*
- User uploads their PDF/Word/notes → summaries, flashcards, and quizzes are generated from **their** content. No other app has their uploaded docs + their courses in one place.

### 4. **One Academic Command Center**
- Grades + Planner + Courses + Notes + Study tools + AI in **one** app. No switching between Notion, ChatGPT, and a grades spreadsheet.
- Export: transcript or progress report for scholarships/advisor — one click from **their** data.

### 5. **Smart Reminders (Future)**
- *"امتحان رياضيات بعد 3 أيام — درجتك الحالية 72%، تحتاج 78% في الامتحان لتمر."*
- Only possible because we have: course + current grade + grade scheme + planner deadline.

### 6. **Landing & In-App Messaging**
- Add a clear **"Why UniPilot?"** section: 3–4 bullets (AR + EN) stating that ChatGPT doesn't know your grades/schedule, UniPilot does and gives personalized advice; one place for everything; study from your own materials.

---

## Copy You Can Use (AR / EN)

**Arabic (لماذا UniPilot؟)**  
- ChatGPT لا يعرف درجاتك ولا جدولك — UniPilot يعرف، ويعطيك نصائح مبنية على **بياناتك** فقط.  
- مكان واحد: معدلك، موادك، مخططك، ملاحظاتك، وأدوات الدراسة من ملفاتك.  
- "كم أحتاج في الامتحان النهائي؟" — الإجابة من درجاتك الحقيقية، لا يدوياً.  
- ملخص وبطاقات واختبار من **ملفاتك وملاحظاتك** أنت، وليس من النت.

**English (Why UniPilot?)**  
- ChatGPT doesn't know your grades or schedule — UniPilot does and gives advice based on **your** data only.  
- One place: your GPA, courses, planner, notes, and study tools from your own files.  
- "What do I need on the final?" — Answered from your real grades, not manual math.  
- Summaries, flashcards, and quizzes from **your** uploads and notes, not the web.

---

## Implementation Checklist (Done / To Do)

- [x] AI Coach receives course list, grades, CGPA, tasks (buildCoachContext).
- [x] Document strategy (this file).
- [ ] **Landing page:** Add "Why UniPilot?" section with 4 bullets (AR+EN).
- [ ] **Dashboard:** Show one personalized line (e.g. focus on weakest course with current %).
- [ ] **Course detail:** "Required final grade" calculator (target % → needed final %).
- [ ] **Study Tools / Landing:** Emphasize "from your materials" in copy.
- [ ] (Later) Smart reminders: "Exam in 3 days — you need X% on final to pass."
